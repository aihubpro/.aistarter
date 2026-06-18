const pool = require('../database');
const { formatDate } = require('../utils/utils');

// 获取聊天消息历史
const getChatHistory = async (req, res) => {
  const { chatId, page = 1, size = 10, timeRange = '180d' } = req.query;
  const userId = req.user_id;
  
  if (!chatId) {
    return res.json({ code: -1, msg: '聊天ID不能为空' });
  }

  try {
    // 验证用户是否有权限访问此聊天
    const session = await pool.query(
      'SELECT * FROM chat_sessions WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)',
      [chatId, userId, userId]
    );

    // 官方会话（chat_0_xxx格式）允许访问，即使没有session记录
    if (session.length === 0 && !chatId.startsWith('chat_0_')) {
      return res.json({ code: -2, msg: '没有权限访问此聊天' });
    }

    // 计算分页参数，限制总共只能获取30条数据
    const maxTotalRecords = 30;
    const offset = (parseInt(page) - 1) * parseInt(size);
    const limit = parseInt(size);
    
    // 如果请求的起始位置超过30条限制，返回空数据
    if (offset >= maxTotalRecords) {
      return res.json({
        code: 0,
        msg: 'success',
        data: {
          total: maxTotalRecords,
          current: parseInt(page),
          size: parseInt(size),
          records: []
        }
      });
    }
    
    // 调整limit，确保不超过30条总限制
    const adjustedLimit = Math.min(limit, maxTotalRecords - offset);

    // 构建时间范围条件
    let timeCondition = '';
    let timeParams = [];
    
    if (timeRange !== 'all') {
      switch (timeRange) {
        case '7d':
          timeCondition = ' AND cm.create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case '30d':
          timeCondition = ' AND cm.create_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        case '90d':
          timeCondition = ' AND cm.create_time >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
          break;
        case '180d':
          timeCondition = ' AND cm.create_time >= DATE_SUB(NOW(), INTERVAL 180 DAY)';
          break;
        case '1y':
          timeCondition = ' AND cm.create_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
          break;
        default:
          // 自定义时间范围，格式：YYYY-MM-DD
          if (timeRange.match(/^\d{4}-\d{2}-\d{2}$/)) {
            timeCondition = ' AND cm.create_time >= ?';
            timeParams.push(timeRange + ' 00:00:00');
          }
      }
    }

    // 从数据库获取消息历史
    let messages, totalRows;
    
    // 检查是否为官方会话（chat_0_xxx格式）
    if (chatId.startsWith('chat_0_')) {
      let chatIds;
      if (chatId === 'chat_0_0') {
        // 广播会话：同时查询广播和个人对话
        chatIds = ['chat_0_0', `chat_0_${userId}`];
      } else {
        // 个人官方会话：同时查询个人对话和公开广播
        chatIds = [chatId, 'chat_0_0'];
      }
      
      messages = await pool.query(
        `SELECT cm.*, 
               CASE WHEN cm.sender_id = 0 THEN 'AIstarter' ELSE u.username END as username,
               CASE WHEN cm.sender_id = 0 THEN 'AIstarter/AIstarter.png' ELSE ui.avatar_url END as avatar_url
         FROM chat_messages cm
         LEFT JOIN users u ON cm.sender_id = u.id AND cm.sender_id != 0
         LEFT JOIN users_info ui ON u.id = ui.user_id
         WHERE cm.chat_id IN (?, ?)${timeCondition}
         ORDER BY cm.create_time DESC
         LIMIT ?, ?`,
        [chatIds[0], chatIds[1], ...timeParams, offset, adjustedLimit]
      );

      // 获取总消息数（包括个人对话和公开广播），但限制为最多30条
      totalRows = await pool.query(
        `SELECT LEAST(COUNT(*), ?) as total FROM chat_messages cm WHERE cm.chat_id IN (?, ?)${timeCondition}`,
        [maxTotalRecords, chatIds[0], chatIds[1], ...timeParams]
      );
    } else {
      // 普通会话：只查询当前聊天
      messages = await pool.query(
        `SELECT cm.*, 
               CASE WHEN cm.sender_id = 0 THEN 'AIstarter' ELSE u.username END as username,
               CASE WHEN cm.sender_id = 0 THEN 'AIstarter/AIstarter.png' ELSE ui.avatar_url END as avatar_url
         FROM chat_messages cm
         LEFT JOIN users u ON cm.sender_id = u.id AND cm.sender_id != 0
         LEFT JOIN users_info ui ON u.id = ui.user_id
         WHERE cm.chat_id = ?${timeCondition}
         ORDER BY cm.create_time DESC
         LIMIT ?, ?`,
        [chatId, ...timeParams, offset, adjustedLimit]
      );

      // 获取总消息数，但限制为最多30条
      totalRows = await pool.query(
        `SELECT LEAST(COUNT(*), ?) as total FROM chat_messages cm WHERE cm.chat_id = ?${timeCondition}`,
        [maxTotalRecords, chatId, ...timeParams]
      );
    }
    const total = totalRows[0].total;

    // 格式化消息数据
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      uid: msg.sender_id,
      chatid: msg.receiver_id,
      user: {
        username: msg.username,
        avatar: msg.avatar_url
      },
      createTime: formatDate(msg.create_time),
      isRead: Boolean(msg.is_read)
    }));

    // 标记消息为已读
    await markMessagesAsRead(chatId, userId);

    res.json({
      code: 0,
      msg: 'success',
      data: {
        total,
        current: parseInt(page),
        size: parseInt(size),
        records: formattedMessages.reverse() // 按时间正序返回
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

// 获取联系人列表
const getContacts = async (req, res) => {
  const userId = req.user_id;
  const { page = 1, size = 20 } = req.query;

  try {
    // 查询广播消息（user1_id=0 AND user2_id=0）
    const broadcastChat = await pool.query(
      `SELECT cs.*, 
              'AIstarter' as user1_name, 
              0 as user1_id,
              'AIstarter' as user2_name, 
              0 as user2_id,
              NULL as user1_avatar,
              NULL as user2_avatar,
              cm.content as last_message,
              cm.create_time as last_message_time
       FROM chat_sessions cs
       LEFT JOIN chat_messages cm ON cs.last_message_id = cm.id
       WHERE cs.user1_id = 0 AND cs.user2_id = 0
       ORDER BY cs.last_message_time DESC
       LIMIT 1`
    );

    // 查询私聊消息（user2_id=当前用户ID）
    const privateChat = await pool.query(
      `SELECT cs.*, 
              'AIstarter' as user1_name, 
              0 as user1_id,
              'AIstarter' as user2_name, 
              ? as user2_id,
              NULL as user1_avatar,
              NULL as user2_avatar,
              cm.content as last_message,
              cm.create_time as last_message_time
       FROM chat_sessions cs
       LEFT JOIN chat_messages cm ON cs.last_message_id = cm.id
       WHERE cs.user1_id = 0 AND cs.user2_id = ?
       ORDER BY cs.last_message_time DESC
       LIMIT 1`,
      [userId, userId]
    );

    // 查询普通用户联系人（考虑软删除）
    const normalContacts = await pool.query(
      `SELECT cs.*, 
              u1.username as user1_name, u1.id as user1_id,
              u2.username as user2_name, u2.id as user2_id,
              ui1.avatar_url as user1_avatar,
              ui2.avatar_url as user2_avatar,
              cm.content as last_message,
              cm.create_time as last_message_time
       FROM chat_sessions cs
       LEFT JOIN users u1 ON cs.user1_id = u1.id
       LEFT JOIN users u2 ON cs.user2_id = u2.id
       LEFT JOIN users_info ui1 ON u1.id = ui1.user_id
       LEFT JOIN users_info ui2 ON u2.id = ui2.user_id
       LEFT JOIN chat_messages cm ON cs.last_message_id = cm.id
       WHERE (cs.user1_id = ? OR cs.user2_id = ?) AND cs.user1_id != 0 AND cs.user2_id != 0
       AND (
         (cs.user1_id = ? AND (cs.user1_deleted_time IS NULL OR cs.update_time > cs.user1_deleted_time))
         OR 
         (cs.user2_id = ? AND (cs.user2_deleted_time IS NULL OR cs.update_time > cs.user2_deleted_time))
       )
       ORDER BY cs.last_message_time DESC, cs.update_time DESC
       LIMIT ?, ?`,
      [userId, userId, userId, userId, (parseInt(page) - 1) * parseInt(size), parseInt(size)]
    );

    // 合并官方聊天记录，选择最新的一条
    let officialChat = null;
    if (broadcastChat.length > 0 && privateChat.length > 0) {
      // 比较两条记录的时间，选择最新的
      const broadcastTime = new Date(broadcastChat[0].last_message_time || broadcastChat[0].update_time);
      const privateTime = new Date(privateChat[0].last_message_time || privateChat[0].update_time);
      officialChat = broadcastTime >= privateTime ? broadcastChat[0] : privateChat[0];
    } else if (broadcastChat.length > 0) {
      officialChat = broadcastChat[0];
    } else if (privateChat.length > 0) {
      officialChat = privateChat[0];
    }

    // 合并所有联系人
    const contacts = officialChat ? [officialChat, ...normalContacts] : normalContacts;

    // 获取普通联系人数量（考虑软删除）
    const normalContactRows = await pool.query(
      `SELECT COUNT(*) as total FROM chat_sessions 
       WHERE (user1_id = ? OR user2_id = ?) AND user1_id != 0 AND user2_id != 0
       AND (
         (user1_id = ? AND (user1_deleted_time IS NULL OR update_time > user1_deleted_time))
         OR 
         (user2_id = ? AND (user2_deleted_time IS NULL OR update_time > user2_deleted_time))
       )`,
      [userId, userId, userId, userId]
    );
    // 总数包括普通联系人 + 官方聊天（如果存在）
    const total = normalContactRows[0].total + (officialChat ? 1 : 0);

    // 格式化联系人数据
    const formattedContacts = contacts.map(contact => {
      // 对于官方聊天，特殊处理
      if ((contact.user1_id === 0 && contact.user2_id === 0) || (contact.user1_id === 0 && contact.user2_id === userId)) {
        return {
          chatId: contact.chat_id,
          userId: 0,
          username: 'AIstarter',
          avatar: 'AIstarter/AIstarter.png',
          lastMessage: contact.last_message || '',
          lastMessageTime: contact.last_message_time ? formatDate(contact.last_message_time) : null,
          unreadCount: parseInt(contact.user2_unread_count || 0),
          isOnline: true,
          createTime: formatDate(contact.create_time)
        };
      }
      
      // 普通用户聊天
      const otherUserId = contact.user1_id === userId ? contact.user2_id : contact.user1_id;
      const otherUserName = contact.user1_id === userId ? contact.user2_name : contact.user1_name;
      const otherUserAvatar = contact.user1_id === userId ? contact.user2_avatar : contact.user1_avatar;
      const unreadCount = contact.user1_id === userId ? contact.user1_unread_count : contact.user2_unread_count;

      return {
        chatId: contact.chat_id,
        userId: otherUserId,
        username: otherUserName,
        avatar: otherUserAvatar || null,
        lastMessage: contact.last_message || '',
        lastMessageTime: contact.last_message_time ? formatDate(contact.last_message_time) : null,
        unreadCount: parseInt(unreadCount),
        isOnline: false, // 这里可以添加在线状态检查
        createTime: formatDate(contact.create_time)
      };
    });

    res.json({
      code: 0,
      msg: 'success',
      data: {
        total,
        current: parseInt(page),
        size: parseInt(size),
        records: formattedContacts
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

//软删除联系人
const deleteContact = async (req, res) => {
  const { contactId } = req.body;
  const userId = req.user_id;
  console.log('deleteContact', userId, contactId);
  if (contactId === null || contactId === undefined || contactId === '') {
    return res.json({ code: -1, msg: '联系人ID不能为空' });
  }
  try{
    // 查找聊天会话，确认用户有权限删除
    const session = await pool.query(
      'SELECT * FROM chat_sessions WHERE (user1_id = ? OR user2_id = ?) AND (user1_id = ? OR user2_id = ?)',
      [userId, userId, contactId, contactId]
    );
    
    if (session.length === 0) {
      return res.json({ code: -1, msg: '联系人不存在或无权限删除' });
    }
    
    const chatSession = session[0];
    
    // 根据当前用户在会话中的角色，更新对应的删除时间
    let updateQuery;
    let updateParams;
    
    if (chatSession.user1_id === userId) {
      // 当前用户是 user1，更新 user1_deleted_time
      updateQuery = 'UPDATE chat_sessions SET user1_deleted_time = NOW() WHERE id = ?';
      updateParams = [chatSession.id];
    } else if (chatSession.user2_id === userId) {
      // 当前用户是 user2，更新 user2_deleted_time
      updateQuery = 'UPDATE chat_sessions SET user2_deleted_time = NOW() WHERE id = ?';
      updateParams = [chatSession.id];
    } else {
      return res.json({ code: -1, msg: '无权限删除此联系人' });
    }
    
    // 执行软删除
    await pool.query(updateQuery, updateParams);
    
    return res.json({ 
      code: 0, 
      msg: '联系人删除成功',
      data: {
        chatId: chatSession.chat_id,
        deletedAt: new Date().toISOString()
      }
    });
    
  }catch(error){
    console.error('Delete contact error:', error);
    return res.json({ code: -500, msg: 'Database error' });
  }
}


// 创建或获取聊天
const createOrGetChat = async (req, res) => {
  const { targetUserId } = req.body;
  const userId = req.user_id;
  console.log('createOrGetChat', userId, targetUserId);
  if (!targetUserId || targetUserId == userId) { // 验证目标用户ID 不等于0是因为官方聊天会话id为0
    return res.json({ code: -1, msg: '无效的目标用户' });
  }

  try {
    // 检查是否已存在聊天会话
    const existingSession = await pool.query(
      'SELECT * FROM chat_sessions WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [userId, targetUserId, targetUserId, userId]
    );

    let chatId;
    if (existingSession.length > 0) {
      chatId = existingSession[0].chat_id;
    } else {
      // 创建新的聊天会话
      chatId = `chat_${Math.min(userId, targetUserId)}_${Math.max(userId, targetUserId)}`;
      
      await pool.query(
        'INSERT INTO chat_sessions (chat_id, user1_id, user2_id) VALUES (?, ?, ?)',
        [chatId, userId, targetUserId]
      );
    }

    res.json({
      code: 0,
      msg: 'success',
      data: { chatId }
    });
  } catch (error) {
    console.error('Create or get chat error:', error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

// 删除聊天消息
const deleteChatMessage = async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user_id;

  if (!messageId) {
    return res.json({ code: -1, msg: '消息ID不能为空' });
  }

  try {
    // 验证用户权限（只能删除自己发送的消息）
    const message = await pool.query(
      'SELECT * FROM chat_messages WHERE id = ? AND sender_id = ?',
      [messageId, userId]
    );

    if (message.length === 0) {
      return res.json({ code: -2, msg: '没有权限删除此消息' });
    }

    // 删除消息
    await pool.query(
      'DELETE FROM chat_messages WHERE id = ?',
      [messageId]
    );

    res.json({ code: 0, msg: 'success' });
  } catch (error) {
    console.error('Delete chat message error:', error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

// 获取用户在线状态
const getUserOnlineStatus = async (req, res) => {
  const { userIds } = req.query;
  
  if (!userIds || !Array.isArray(userIds)) {
    return res.json({ code: -1, msg: '用户ID列表不能为空' });
  }

  try {
    // 这里可以实现在线状态检查逻辑
    // 暂时返回所有用户为离线状态
    const onlineStatus = {};
    for (const userId of userIds) {
      onlineStatus[userId] = false;
    }

    res.json({
      code: 0,
      msg: 'success',
      data: onlineStatus
    });
  } catch (error) {
    console.error('Get user online status error:', error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

// 标记消息为已读
const markMessagesAsRead = async (chatId, userId) => {
  try {
    // 更新消息状态
    await pool.query(
      'UPDATE chat_messages SET is_read = 1 WHERE chat_id = ? AND receiver_id = ? AND is_read = 0',
      [chatId, userId]
    );

    // 更新会话中的未读消息数
    await pool.query(
      `UPDATE chat_sessions 
       SET user1_unread_count = CASE WHEN user1_id = ? THEN 0 ELSE user1_unread_count END,
           user2_unread_count = CASE WHEN user2_id = ? THEN 0 ELSE user2_unread_count END
       WHERE chat_id = ?`,
      [userId, userId, chatId]
    );
  } catch (error) {
    console.error('Mark messages as read error:', error);
  }
};

//获取未读消息数
const getUnreadMessageCount = async (req, res) => {
  const userId = req.user_id;
  
  try {
    // 方法1: 从chat_sessions表获取未读消息总数
    const sessionResult = await pool.query(
      `SELECT 
        SUM(CASE WHEN user1_id = ? THEN user1_unread_count ELSE 0 END) +
        SUM(CASE WHEN user2_id = ? THEN user2_unread_count ELSE 0 END) as total_unread
       FROM chat_sessions 
       WHERE user1_id = ? OR user2_id = ?`,
      [userId, userId, userId, userId]
    );
    
    const totalUnread = sessionResult[0]?.total_unread || 0;
    
    // 方法2: 也可以直接从chat_messages表统计（备用方案）
    // const messageResult = await pool.query(
    //   'SELECT COUNT(*) as unread_count FROM chat_messages WHERE receiver_id = ? AND is_read = 0',
    //   [userId]
    // );
    // const totalUnread = messageResult[0]?.unread_count || 0;

    //获取评论未读消息数
    const commentResult = await pool.query(
      'SELECT COUNT(*) as unread_count FROM comment_message WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    const totalUnreadComment = commentResult[0]?.unread_count || 0;

    //获取点赞未读消息数
    const likeResult = await pool.query(
      'SELECT COUNT(*) as unread_count FROM like_message WHERE user_id = ? AND is_read = 0 AND message_type = 1',
      [userId]
    );
    const totalUnreadLike = likeResult[0]?.unread_count || 0;
    
    return res.json({
      code: 200,
      msg: 'success',
      data: {
        unread_count: parseInt(totalUnread) + parseInt(totalUnreadComment) + parseInt(totalUnreadLike),
        message_unread_count: parseInt(totalUnread),
        comment_unread_count: parseInt(totalUnreadComment),
        like_unread_count: parseInt(totalUnreadLike)
      }
    });
    
  } catch (error) {
    console.error('Get unread message count error:', error);
    return res.json({
      code: -1,
      msg: '获取未读消息数失败',
      error: error.message
    });
  }
};

module.exports = {
  getChatHistory,
  getContacts,
  deleteContact,
  createOrGetChat,
  deleteChatMessage,
  getUserOnlineStatus,
  markMessagesAsRead,
  getUnreadMessageCount
};