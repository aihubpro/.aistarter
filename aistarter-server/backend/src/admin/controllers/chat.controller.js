const pool = require('../../database')
const { formatDateTimeSync } = require('../../helpers/functions')

// 获取聊天数据列表
const getChatList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', receiver_name, is_read } = req.query
    const limit = parseInt(size, 10)
    const offset = (parseInt(current, 10) - 1) * limit
    const isAsc = asc === 'true'
    const sortOrder = isAsc ? 'ASC' : 'DESC'

    // 构建WHERE条件
    function buildWhereClause(queryParams) {
      const conditions = []
      const params = []

      conditions.push('c.sender_id = ?') // 只查询发送者为管理员
      params.push(0)

      if (queryParams.receiver_name) {
        conditions.push('u.username LIKE ?')
        params.push(`%${queryParams.receiver_name}%`)
      }

      if (queryParams.is_read) {
        conditions.push('c.is_read = ?')
        params.push(queryParams.is_read)
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      }
    }

    const { whereClause, whereParams } = buildWhereClause({ receiver_name, is_read })

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM chat_messages c LEFT JOIN users u ON c.receiver_id = u.id AND c.receiver_id != 0 ${whereClause}`, whereParams)
    const total = Number(totalRows[0].total)

    // 分页查询
    const rows = await pool.query(
      `SELECT 
        c.id,
        c.chat_id,
        c.sender_id,
        c.receiver_id,
        c.content,
        c.message_type,
        c.is_read,
        c.create_time,
        '管理员' AS sender_name,
        CASE 
          WHEN c.receiver_id = 0 THEN '全体成员'
          ELSE u.username
        END AS receiver_name
      FROM chat_messages c
      LEFT JOIN users u ON c.receiver_id = u.id AND c.receiver_id != 0
      ${whereClause}
       ORDER BY c.id ${sortOrder}
       LIMIT ?, ?`,
       [...whereParams, offset, limit]
    )

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      create_time: formatDateTimeSync(row.create_time)
    }))

    // 发送 JSON 响应
    res.json({
      msg: 'success',
      code: 0,
      data: {
        total,
        size,
        current,
        records: data
      }
    })
  } catch (error) {
    console.error('获取聊天数据失败:', error)
    res.json({ msg: 'Failed to fetch chat list.', code: -500 })
  }
}

// 获取聊天统计数据
const getChatStatistics = async (req, res) => {
  try {
    // 今日聊天数量
    const todayQuery = `
      SELECT COUNT(*) as today_count
      FROM chat_messages
      WHERE DATE(created_at) = CURDATE()
    `
    const [todayResults] = await pool.execute(todayQuery)

    // 本周聊天数量
    const weekQuery = `
      SELECT COUNT(*) as week_count
      FROM chat_messages
      WHERE YEARWEEK(created_at) = YEARWEEK(NOW())
    `
    const [weekResults] = await pool.execute(weekQuery)

    // 本月聊天数量
    const monthQuery = `
      SELECT COUNT(*) as month_count
      FROM chat_messages
      WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())
    `
    const [monthResults] = await pool.execute(monthQuery)

    // 活跃用户数量
    const activeUsersQuery = `
      SELECT COUNT(DISTINCT user_id) as active_users
      FROM chat_messages
      WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `
    const [activeUsersResults] = await pool.execute(activeUsersQuery)

    return res.json({
      code: 0,
      msg: 'success',
      data: {
        today_count: todayResults[0].today_count,
        week_count: weekResults[0].week_count,
        month_count: monthResults[0].month_count,
        active_users: activeUsersResults[0].active_users
      }
    })
  } catch (error) {
    console.error('获取聊天统计数据失败:', error)
    return res.status(500).json({
      code: 500,
      msg: '获取聊天统计数据失败',
      error: error.message
    })
  }
}

// 群发消息
const broadcastMessage = async (req, res) => {
  try {
    const { message, target_type = 'all', target_users = 0,target_name = '' } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({
        code: 400,
        msg: '消息内容不能为空'
      })
    }
    let usersdata;
    if (target_type == 'user' && target_users) { 
      usersdata = await pool.query('SELECT * FROM users WHERE id = ?', [target_users])
      if (usersdata.length == 0) {
        return res.status(400).json({
          code: 400,
          msg: '用户不存在'
        })
      }
    }
    if (target_type == 'user' && target_name) {
      usersdata = await pool.query('SELECT * FROM users WHERE username = ?', [target_name])
      if (usersdata.length == 0) {
        return res.status(400).json({
          code: 400,
          msg: '用户不存在'
        })
      }
    }

    if (target_type === 'all') {
      // 广播消息 - chat_0_0
      const chat_id = 'chat_0_0'
      
      // 检查并创建chat_sessions记录
      const checkSessionQuery = 'SELECT id FROM chat_sessions WHERE chat_id = ?'
      const existingSession = await pool.query(checkSessionQuery, [chat_id])
      
      if (existingSession.length === 0) {
        // 创建广播聊天会话
        const createSessionQuery = `
          INSERT INTO chat_sessions (chat_id, user1_id, user2_id, create_time, update_time)
          VALUES (?, 0, 0, NOW(), NOW())
        `
        await pool.query(createSessionQuery, [chat_id])
      }
      
      // 创建广播消息记录
      const insertMessageQuery = `
        INSERT INTO chat_messages (chat_id, sender_id, receiver_id, content, message_type,is_read, create_time)
        VALUES (?, 0, 0, ?, 'text',1, NOW())
      `
      const messageResult = await pool.query(insertMessageQuery, [chat_id, message])
      const messageId = messageResult.insertId
      
      // 更新chat_sessions的最后消息信息和未读计数
      const updateSessionQuery = `
        UPDATE chat_sessions 
        SET last_message_id = ?, last_message_time = NOW()
        WHERE chat_id = ?
      `
      await pool.query(updateSessionQuery, [messageId, chat_id])
      
    } else if (target_type == 'user'){
      // 单独发送消息 - chat_0_用户ID
      const chat_id = `chat_0_${usersdata[0].id}`
      
      // 检查并创建chat_sessions记录
      const checkSessionQuery = 'SELECT id FROM chat_sessions WHERE chat_id = ?'
      const existingSession = await pool.query(checkSessionQuery, [chat_id])
      
      if (existingSession.length === 0) {
        // 创建私聊会话
        const createSessionQuery = `
          INSERT INTO chat_sessions (chat_id, user1_id, user2_id, create_time, update_time)
          VALUES (?, 0, ?, NOW(), NOW())
        `
        await pool.query(createSessionQuery, [chat_id, usersdata[0].id])
      }
      
      // 创建私聊消息记录
      const insertMessageQuery = `
        INSERT INTO chat_messages (chat_id, sender_id, receiver_id, content, message_type, create_time)
        VALUES (?, 0, ?, ?, 'text', NOW())
      `
      const messageResult = await pool.query(insertMessageQuery, [chat_id, usersdata[0].id, message])
      const messageId = messageResult.insertId
      
      // 更新chat_sessions的最后消息信息和未读计数
      const updateSessionQuery = `
        UPDATE chat_sessions 
        SET last_message_id = ?, last_message_time = NOW(), user2_unread_count = user2_unread_count + 1
        WHERE chat_id = ?
      `
      await pool.query(updateSessionQuery, [messageId, chat_id])
    }

    return res.json({
      code: 0,
      msg: '消息发送成功',
      data: {
        message_type: target_type === 'all' ? '广播消息' : '私聊消息'
      }
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    return res.status(500).json({
      code: 500,
      msg: '发送消息失败',
      error: error.message
    })
  }
}

// 获取群发记录
const getBroadcastHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const query = `
      SELECT 
        b.id,
        b.admin_id,
        b.message,
        b.target_type,
        b.target_count,
        b.created_at,
        u.username as admin_name
      FROM broadcast_messages b
      LEFT JOIN users u ON b.admin_id = u.id
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `

    const [results] = await pool.execute(query, [parseInt(limit), offset])

    // 查询总数
    const countQuery = 'SELECT COUNT(*) as total FROM broadcast_messages'
    const [countResults] = await pool.execute(countQuery)
    const total = countResults[0].total

    return res.json({
      code: 0,
      msg: 'success',
      data: {
        list: results,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取群发记录失败:', error)
    return res.status(500).json({
      code: 500,
      msg: '获取群发记录失败',
      error: error.message
    })
  }
}

// 删除聊天记录
const deleteChatMessage = async (req, res) => {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({
        code: 400,
        msg: '消息ID不能为空'
      })
    }

    const deleteQuery = 'DELETE FROM chat_messages WHERE id = ?'
    const result = await pool.query(deleteQuery, [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        msg: '消息不存在'
      })
    }

    return res.json({
      code: 0,
      msg: '删除成功'
    })
  } catch (error) {
    console.error('删除聊天记录失败:', error)
    return res.status(500).json({
      code: 500,
      msg: '删除聊天记录失败',
      error: error.message
    })
  }
}

module.exports = {
  getChatList, // 获取聊天数据列表
  getChatStatistics, // 获取聊天统计数据
  broadcastMessage, // 群发消息
  getBroadcastHistory, // 获取群发记录
  deleteChatMessage // 删除聊天记录
}