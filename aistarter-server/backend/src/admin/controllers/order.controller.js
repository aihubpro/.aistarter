const pool = require('../../database')
const { formatDateTimeSync } = require('../../helpers/functions')
const { generateCouponNo } = require('../../utils/utils')

//获取订单列表
const getPayOrderList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', order_no, biz_order_no, title,user_id,user_name,merchant_id,merchant_name, create_time,startdate,enddate,timetype, method, refund_status, status} = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];
      // 对于日期类型，需要特别处理
      if (queryParams['startdate']) {
        conditions.push(`DATE(create_time) >= ?`);
        params.push(queryParams['startdate']);
      } 
      if (queryParams['enddate']) {
        conditions.push(`DATE(create_time) <= ?`);
        params.push(queryParams['enddate']);
      }
      // 处理完后建议删除这两个字段，避免后续重复处理
      delete queryParams['startdate'];
      delete queryParams['enddate'];

      if(queryParams['timetype']){
        // 处理 create_time 的时间范围
        const currentTime = new Date();
        let timeOffset;
        switch (queryParams['timetype']) {
          case 'oneMonth':
            timeOffset = 30; // 大约一个月
            break;
          case 'threeMonth':
            timeOffset = 90; // 大约三个月
            break;
          case 'halfYear':
            timeOffset = 180; // 大约半年
            break;
          case 'oneYear':
            timeOffset = 365; // 大约一年
            break;
        }
        // 计算时间范围
        const startDate = new Date(currentTime);
        startDate.setDate(currentTime.getDate() - timeOffset);
        // 添加条件
        conditions.push(`DATE(create_time) BETWEEN ? AND ?`);
        params.push(formatDateTimeSync(startDate));
        params.push(formatDateTimeSync(currentTime));
        // 处理完后建议删除这两个字段，避免后续重复处理
        delete queryParams['timetype'];
      }
    
      // for (const key in queryParams) {
      //   if (queryParams[key] && queryParams[key] !== '') {
      //     // 对于日期类型，需要特别处理
      //     if (key === 'create_time') {
      //       conditions.push(`DATE(${pool.escapeId(key)}) = ?`);
      //       params.push(queryParams[key]);
      //     } else if (key === 'method' || key === 'refund_status' || key === 'status') {
      //       // 对于枚举类型，直接比较
      //       conditions.push(`${pool.escapeId(key)} = ?`);
      //       params.push(queryParams[key]);
      //     } else {
      //       // 对于字符串类型，使用 LIKE 操作符
      //       conditions.push(`${pool.escapeId(key)} LIKE ?`);
      //       params.push(`%${queryParams[key]}%`);
      //     }
      //   }
      // }
      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if (key === 'create_time') {
            conditions.push(`DATE(${pool.escapeId(key)}) = ?`);
            params.push(queryParams[key]);
          } else if (key === 'method' || key === 'refund_status' || key === 'status' || key === 'user_id' || key === 'merchant_id') {
            // 对于枚举类型和ID类型，直接比较
            conditions.push(`${pool.escapeId(key)} = ?`);
            params.push(queryParams[key]);
          } else {
            // 对于字符串类型，使用 LIKE 操作符
            conditions.push(`${pool.escapeId(key)} LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }
        }
      }
    
      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({order_no, biz_order_no, title,user_id,user_name,merchant_id,merchant_name, create_time,startdate,enddate,timetype, method, refund_status, status});

    // console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(amount) AS totalAmount FROM pay_order ${whereClause}`,[...whereParams]);
    const total = Number(totalRows[0].total);
    const totalAmount = Number(totalRows[0].totalAmount);

    // 分页查询
    const rows = await pool.query(
      `SELECT * 
       FROM pay_order
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      create_time: formatDateTimeSync(row.create_time)
    }));

    // 发送 JSON 响应
    res.json({
      msg: 'success',
      code: 0,
      data: {
        total,
        totalAmount,
        size,
        current,
        records: data
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch upload list.' , code: -500});
  }
}

//获取提现订单列表
const getWithdrawList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', withdraw_no, user_id, user_name,id_card,mobile,bank_account,bank_name, create_time, method, status} = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if (key === 'create_time') {
            conditions.push(`DATE(${pool.escapeId(key)}) = ?`);
            params.push(queryParams[key]);
          } else if (key === 'method' || key === 'status') {
            // 对于枚举类型，直接比较
            conditions.push(`${pool.escapeId(key)} = ?`);
            params.push(queryParams[key]);
          } else {
            // 对于字符串类型，使用 LIKE 操作符
            conditions.push(`${pool.escapeId(key)} LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }
        }
      }
    
      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({withdraw_no, user_id, user_name,id_card,mobile,bank_account,bank_name, create_time, method, status});

      // 获取总记录数
      const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(amount) AS totalAmount FROM withdraw_order ${whereClause}`,[...whereParams]);
      const total = Number(totalRows[0].total);
      const totalAmount = Number(totalRows[0].totalAmount);
  
      // 分页查询
      const rows = await pool.query(
        `SELECT * 
          FROM withdraw_order
          ${whereClause}
          ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
          LIMIT ?, ?`,
        [...whereParams, offset, limit]
      );
  
      // 准备响应数据
      const data = rows.map(row => ({
        ...row,
        audit_time: row.audit_time?formatDateTimeSync(row.audit_time):'',
        pay_time: row.pay_time?formatDateTimeSync(row.pay_time):'',
        create_time: formatDateTimeSync(row.create_time),
        update_time: formatDateTimeSync(row.update_time)
      }));
  
      // 发送 JSON 响应
      res.json({
        msg: 'success',
        code: 0,
        data: {
          total,
          totalAmount,
          size,
          current,
          records: data
        }
      });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch withdraw list.' , code: -500});
  }
}
//审核提现订单
const auditWithdrawOrder = async (req, res) => {
  const { data, status } = req.body;
  try {
    let sql = 'UPDATE withdraw_order SET status = ? WHERE id = ?'
    let params = [status, data.id]
    switch (status) {
      case 1: //审核通过
        //修改状态并记录审核时间
        sql = `UPDATE withdraw_order SET status =?,audit_time =? WHERE id =?`
        params = [status, new Date(), data.id]
        break;
      case 2: //打款中
        //修改状态并记录打款时间
        sql = `UPDATE withdraw_order SET status =?,pay_time =? WHERE id =?`
        params = [status, new Date(), data.id]
        break;
      case 3: //已完成

        break;
      case 4: //已拒绝

        break;
      case 5: //已撤消
        //将用户余额加回去
        await pool.query(`UPDATE users_info SET balance = balance + ? WHERE user_id = ?`, [data.amount, data.user_id])
        //修改状态 且记录取消原因
        sql = `UPDATE withdraw_order SET status =?,remark =? WHERE id =?`
        params = [status, data.remark, data.id]
        break;
    }
    //执行SQL
    await pool.query(sql, params)
    //TODO:审核通过则后续提现金额到用户指定账户
    //这里写提现逻辑
    


    return res.json({ msg: 'success', code: 0 });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to audit withdraw order.' , code: -500});
  }
}

//获取收益核验列表
const getUserOrderList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', user_id,username,year,month,created_at,audit_status} = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if (key === 'created_at') {
            conditions.push(`DATE(${pool.escapeId(key)}) = ?`);
            params.push(queryParams[key]);
          } else if (key === 'audit_status'||  key === 'year' ||  key === 'month') {
            // 对于枚举类型，直接比较
            conditions.push(`${pool.escapeId(key)} = ?`);
            params.push(queryParams[key]);
          } else {
            // 对于字符串类型，使用 LIKE 操作符
            conditions.push(`${pool.escapeId(key)} LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }
        }
      }
    
      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({user_id,username,year,month,created_at,audit_status});

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(income_amount) AS totalAmount FROM user_monthly_income_audit ${whereClause}`,[...whereParams]);
    const total = Number(totalRows[0].total);
    const totalAmount = Number(totalRows[0].totalAmount);

    // 分页查询
    const rows = await pool.query(
      `SELECT * 
        FROM user_monthly_income_audit
        ${whereClause}
        ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
        LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      created_at: formatDateTimeSync(row.created_at)
    }));

    // 发送 JSON 响应
    res.json({
      msg: 'success',
      code: 0,
      data: {
        total,
        totalAmount,
        size,
        current,
        records: data
      }
    });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch userOrder list.' , code: -500});
  }
}

// 获取上个月订单
const getLastMonthOrder = async (req, res) => { 
  const { year, month } = req.query;
  try {
    // 每月任务逻辑
    // 计算上个月的起止时间
    const { formatDate } = require('../../utils/utils');
    const { readConfig } = require('../../helpers/storage')
    //获取平台配置V2
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
        payConfig = require("../../datas/pay_platform_cfg_v2.data")
    }
    let platformFeeRate = payConfig.platformFee / 100;
    const now = new Date();
    // const year = now.getFullYear();
    // const month = now.getMonth(); // 0-11
    const lastMonth = month === 12 ? 11 : month - 1;
    const lastMonthYear = month === 12 ? year - 1 : year;
    // 上个月第一天
    const startDate = new Date(lastMonthYear, lastMonth, 1, 0, 0, 0);
    const startOfLastMonth = formatDate(startDate);
    // 上个月最后一天
    const endDate = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59);
    const endOfLastMonth = formatDate(endDate);
    // 查询上个月每个商家的订单数据
    let rows = await pool.query(`
        SELECT merchant_id, merchant_name, 
            COUNT(*) AS pay_count,
            SUM(CASE WHEN refund_status=1 THEN 1 ELSE 0 END) AS refund_count,
            SUM(CASE WHEN refund_status=0 THEN amount ELSE 0 END) AS income_amount,
            SUM(CASE WHEN refund_status=1 THEN amount ELSE 0 END) AS refund_amount
        FROM pay_order
        WHERE status = 1 AND create_time BETWEEN ? AND ?
        GROUP BY merchant_id, merchant_name
    `, [startOfLastMonth, endOfLastMonth]);
    // 插入到 user_monthly_income_audit 表
    if (!Array.isArray(rows)) rows = [rows];
    for(const row of rows) {
      //查询用户是否有独立的平台费
      const platformfee = await pool.query(`SELECT platform_fee FROM users WHERE id = ?`, [row.merchant_id]);
      let platformFeeUser = platformFeeRate;
      if(platformfee.length > 0){
        //判断platformfee[0].platform_fee是否为空 为空则使用默认平台费
        if(platformfee[0].platform_fee){
          platformFeeUser = platformfee[0].platform_fee / 100;
        }
      }

      await pool.query(`
          INSERT INTO user_monthly_income_audit
          (user_id, username, year,month, pay_order_count, refund_order_count, income_amount,platformfee_amount, refund_amount, audit_status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?,?, ?, 0, NOW())
      `, [row.merchant_id?row.merchant_id:0, row.merchant_name, lastMonthYear, (lastMonth+1), row.pay_count, row.refund_count, row.income_amount,(row.income_amount*platformFeeUser), row.refund_amount]);
    }
    return res.json({ msg: 'success' , code: 0});
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch userOrder list.' , code: -500});
  }
}

//批量删除月订单
const deleteLastMonthOrder = async (req, res) => {
  const { year, month } = req.body;
  try{
    //批量删除指定年月的订单
    await pool.query('DELETE FROM user_monthly_income_audit WHERE year = ? AND month = ?', [year, month]);
    return res.json({ msg: 'success' , code: 0});
  }catch (error) {
    console.error(error);
    return res.json({ msg: 'Failed to fetch userOrder list.' , code: -500});
  }
}

//删除收益核验记录
const delUserOrder = async (req, res) => {
  const { id } = req.body;
  try {
    const result = await pool.query('DELETE FROM user_monthly_income_audit WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      return res.json({ msg: 'success' , code: 0});
    } else {
      return res.json({ msg: 'error' , code: 1});
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//批量删除收益核验记录
const delUserOrderBatch = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await pool.query('DELETE FROM user_monthly_income_audit WHERE id IN (?)', [ids]);
    if (result.affectedRows > 0) {
      return res.json({ msg: 'success' , code: 0});
    } else {
      return res.json({ msg: 'error' , code: 1});
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//收益核验审核通过
const passUserOrder = async (req, res) => {
  const {data, status} = req.body;
  try {
    let userAmount = 0;
    userAmount = Number(data.income_amount) - Number(data.platformfee_amount); //用户实际收益 = 收益金额 - 平台服务费
    //先更新用户余额（将收益金额追加到用户余额中）
    //检测用户是否存在
    const user = await pool.query('SELECT * FROM users_info WHERE user_id =?', [data.user_id]);
    if (user.length == 0) {
      //创建对应的用户
      const result2 = await pool.query('INSERT INTO users_info (user_id, balance) VALUES (?,?)', [data.user_id, userAmount]);
      if (result2.affectedRows == 0) {
        return res.json({ msg: 'fail' , code: -1});
      }
    }else{
      //更新用户余额
      const result2 = await pool.query('UPDATE users_info SET balance = balance + ? WHERE user_id = ?', [userAmount, data.user_id]);
      if (result2.affectedRows == 0) {
        return res.json({ msg: 'fail' , code: -1});
      }
    }
    //再更新审核状态
    const result = await pool.query('UPDATE user_monthly_income_audit SET audit_status = ? WHERE id = ?', [status, data.id]);
    if (result.affectedRows > 0) {
      return res.json({ msg: 'success' , code: 0});
    }
    return res.json({ msg: 'fail' , code: -1});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//批量收益核验审核通过
const batchPassUserOrder = async (req, res) => {
  const {ids, status} = req.body; 
  try {
    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ msg: 'ids参数无效', code: -1 });
    }
    
    if (status === undefined || status === null) {
      return res.json({ msg: 'status参数无效', code: -1 });
    }
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    // 批量处理每个订单
    for (const id of ids) {
      try {
        // 获取订单详情
        const orderResult = await pool.query('SELECT * FROM user_monthly_income_audit WHERE id = ?', [id]);
        if (orderResult.length === 0) {
          errors.push(`订单ID ${id} 不存在`);
          failCount++;
          continue;
        }
        
        const orderData = orderResult[0];
        
        // 如果已经审核过，跳过
        if (orderData.audit_status !== 0) {
          errors.push(`订单ID ${id} 已经审核过`);
          failCount++;
          continue;
        }
        
        let userAmount = 0;
        userAmount = Number(orderData.income_amount) - Number(orderData.platformfee_amount); //用户实际收益 = 收益金额 - 平台服务费
        
        //先更新用户余额（将收益金额追加到用户余额中）
        //检测用户是否存在
        const user = await pool.query('SELECT * FROM users_info WHERE user_id = ?', [orderData.user_id]);
        if (user.length == 0) {
          //创建对应的用户
          const result2 = await pool.query('INSERT INTO users_info (user_id, balance) VALUES (?, ?)', [orderData.user_id, userAmount]);
          if (result2.affectedRows == 0) {
            errors.push(`订单ID ${id} 创建用户余额失败`);
            failCount++;
            continue;
          }
        } else {
          //更新用户余额
          const result2 = await pool.query('UPDATE users_info SET balance = balance + ? WHERE user_id = ?', [userAmount, orderData.user_id]);
          if (result2.affectedRows == 0) {
            errors.push(`订单ID ${id} 更新用户余额失败`);
            failCount++;
            continue;
          }
        }
        
        //再更新审核状态
        const result = await pool.query('UPDATE user_monthly_income_audit SET audit_status = ? WHERE id = ?', [status, id]);
        if (result.affectedRows > 0) {
          successCount++;
        } else {
          errors.push(`订单ID ${id} 更新审核状态失败`);
          failCount++;
        }
      } catch (error) {
        console.error(`处理订单ID ${id} 时出错:`, error);
        errors.push(`订单ID ${id} 处理异常: ${error.message}`);
        failCount++;
      }
    }
    
    // 返回处理结果
    const result = {
      msg: 'success',
      code: 0,
      data: {
        total: ids.length,
        success: successCount,
        fail: failCount,
        errors: errors
      }
    };
    
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//收益核验批量审核通过
const batchAuditUserOrder = async (req, res) => { 
  const { year, month, status = 1 } = req.body;
  
  try {
    // 获取指定年月的所有待审核订单（audit_status = 0），排除系统官方收款（user_id = 0）
    let queryResult = await pool.query(`
      SELECT * FROM user_monthly_income_audit 
      WHERE year = ? AND month = ? AND audit_status = 0 AND user_id != 0
    `, [year, month]);
    
    // 兼容不同MySQL驱动的返回格式
    let orders;
    if (Array.isArray(queryResult)) {
      orders = queryResult[0] || queryResult;
    } else {
      orders = queryResult;
    }
    
    // 确保orders是数组
    if (!Array.isArray(orders)) {
      orders = orders ? [orders] : [];
    }
    
    if (orders.length === 0) {
      return res.json({ msg: '没有找到待审核的订单', code: 0, data: { processedCount: 0 } });
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // 批量处理每个订单
    for (const order of orders) {
      try {
        // 计算用户实际收益 = 收益金额 - 平台服务费
        let userAmount = Number(order.income_amount) - Number(order.platformfee_amount || 0)
        
        // 检测用户是否存在
        const user = await pool.query('SELECT * FROM users_info WHERE user_id = ?', [order.user_id]);
        
        if (user.length === 0) {
          // 创建对应的用户
          const createResult = await pool.query('INSERT INTO users_info (user_id, balance) VALUES (?, ?)', [order.user_id, userAmount]);
          if (createResult.affectedRows === 0) {
            failCount++;
            continue;
          }
        } else {
          // 更新用户余额
          const updateResult = await pool.query('UPDATE users_info SET balance = balance + ? WHERE user_id = ?', [userAmount, order.user_id]);
          if (updateResult.affectedRows === 0) {
            failCount++;
            continue;
          }
        }
        
        // 更新审核状态
        const auditResult = await pool.query('UPDATE user_monthly_income_audit SET audit_status = ? WHERE id = ?', [status, order.id]);
        if (auditResult.affectedRows > 0) {
          successCount++;
        } else {
          failCount++;
        }
        
      } catch (orderError) {
        console.error(`处理订单 ${order.id} 时出错:`, orderError);
        failCount++;
      }
    }
    
    console.log(`批量审核完成: 成功 ${successCount} 个，失败 ${failCount} 个`);
    
    return res.json({ 
      msg: 'success', 
      code: 0, 
      data: { 
        totalCount: orders.length,
        successCount,
        failCount,
        year,
        month
      }
    });
    
  } catch (error) {
    console.error('批量审核订单失败:', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//修改收益核验订单
const editUserOrder = async (req, res) => {
  const {id, income_amount,platformfee_amount,incometax_amount,refund_amount,pay_order_count,refund_order_count} = req.body;
  try {
    const result = await pool.query('UPDATE user_monthly_income_audit SET income_amount = ?,platformfee_amount= ?,incometax_amount = ?,refund_amount = ?,pay_order_count = ?,refund_order_count = ? WHERE id = ?', [income_amount, platformfee_amount,incometax_amount,refund_amount,pay_order_count,refund_order_count, id]);
    if (result.affectedRows > 0) {
      return res.json({ msg: 'success' , code: 0});
    }else {
      return res.json({ msg: 'fail', code: -1});
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//获取申请优惠列表
const getDiscountApplyList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', applicant_id,applicant_name,reviewer_id,reviewer_name,reviewed_at,created_at,status} = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if (key === 'reviewed_at' || key === 'created_at') {
            conditions.push(`DATE(${pool.escapeId(key)}) = ?`);
            params.push(queryParams[key]);
          } else if ( key === 'status' || key === 'applicant_id' || key === 'reviewer_id') {
            // 对于枚举类型，直接比较
            conditions.push(`${pool.escapeId(key)} = ?`);
            params.push(queryParams[key]);
          } else {
            // 对于字符串类型，使用 LIKE 操作符
            conditions.push(`${pool.escapeId(key)} LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }
        }
      }
    
      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({applicant_id,applicant_name,reviewer_id,reviewer_name,reviewed_at,created_at,status});

      // 获取总记录数
      const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(issued_count) AS totalDiscount FROM coupon_apply ${whereClause}`,[...whereParams]);
      const total = Number(totalRows[0].total);
      const totalDiscount = Number(totalRows[0].totalDiscount);
  
      // 分页查询
      const rows = await pool.query(
        `SELECT * 
          FROM coupon_apply
          ${whereClause}
          ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
          LIMIT ?, ?`,
        [...whereParams, offset, limit]
      );
  
      // 准备响应数据
      const data = rows.map(row => ({
        ...row,
        reviewed_at: row.reviewed_at?formatDateTimeSync(row.reviewed_at):'',
        created_at: formatDateTimeSync(row.created_at)
      }));
  
      // 发送 JSON 响应
      res.json({
        msg: 'success',
        code: 0,
        data: {
          total,
          totalDiscount,
          size,
          current,
          records: data
        }
      });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch withdraw list.' , code: -500});
  }
}
//保存优惠码待审核列表
const saveDiscountApplyList = async (req, res) => {
  const {data} = req.body;
  try {
    //保存修改后的数据
    const result = await pool.query('UPDATE coupon_apply SET review_remark=?,issued_count=? WHERE id =?', [data.review_remark,data.issued_count,data.id]);
    if (result.affectedRows == 0) {
      return res.json({ msg:'failed', code: -1});
    }
    return res.json({ msg: 'success', code: 0});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//设置订单备注
const saveOrderDescription = async (req, res) => {
  const {data} = req.body;
  try {
    //保存修改后的数据
    const result = await pool.query('UPDATE pay_order SET description=? WHERE id =?', [data.description,data.id]);
    if (result.affectedRows == 0) {
      return res.json({ msg:'failed', code: -1});
    }
    return res.json({ msg: 'success', code: 0});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//更新申请优惠审核状态
const updateDiscountApplyStatus = async (req, res) => {
  const {data, status} = req.body;
  try {
    //修改审核状态
    const result = await pool.query('UPDATE coupon_apply SET status =?,reviewer_id =?,reviewer_name=?,reviewed_at =NOW() WHERE id =?', [status, req.user_id,req.user_name,data.id]);
    if (result.affectedRows == 0) {
      return res.json({ msg:'failed', code: -1});
    }
    if(status == 1){ //审核通过
      //插入对应的优惠券
      const couponList = [];
      for(let i = 0; i < data.issued_count; i++){
          couponList.push([
              generateCouponNo(), // 优惠码
              1,                   // 优惠类型 0，金额 1，折扣
              0.8,                 // 优惠金额或折扣
              10000,               // 最低消费金额 (单位：分)
              2000,                // 返现金额 (单位：分)
              formatDateTimeSync(new Date()), // 生效时间
              formatDateTimeSync(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)), //失效时间
              0,                   // 是否使用 0，未使用 1，已使用
              data.applicant_id         // 申请人ID
          ]);
      }
      const sql = 'INSERT INTO coupon (code, discount_type, discount_value, min_amount, cashback_amount, valid_from, valid_to, used, applicant_id) VALUES ?';
      const insertResult = await pool.query(sql, [couponList]);
      if (insertResult.affectedRows == 0) {
        return res.json({ msg:'failed', code: -1});
      }
    }
    return res.json({ msg:'success', code: 0});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//删除申请优惠码数据
const deleteDiscountApply = async (req, res) => {
  const { id } = req.body;
  try {
    const deleteResult = await pool.query('DELETE FROM coupon_apply WHERE id = ?', [id]);
    if (deleteResult.affectedRows == 0) {
      return res.json({ msg:'failed', code: -1});
    }
    return res.json({ msg:'success', code: 0});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//获取优惠码列表
const getCouponList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', code,discount_type,used,applicant_id,user_id,user_name,valid_from,valid_to,create_time} = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if (key === 'create_time' || key === 'valid_from' || key === 'valid_to') {
            conditions.push(`DATE(${pool.escapeId(key)}) = ?`);
            params.push(queryParams[key]);
          } else if ( key === 'used' || key === 'applicant_id' || key === 'user_id' || key === 'discount_type') {
            // 对于枚举类型，直接比较
            conditions.push(`${pool.escapeId(key)} = ?`);
            params.push(queryParams[key]);
          } else {
            // 对于字符串类型，使用 LIKE 操作符
            conditions.push(`${pool.escapeId(key)} LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }
        }
      }
    
      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({code,discount_type,used,applicant_id,user_id,user_name,valid_from,valid_to,create_time});

      // 获取总记录数
      const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(cashback_amount) AS totalAmount FROM coupon ${whereClause}`,[...whereParams]);
      const total = Number(totalRows[0].total);
      const totalAmount = Number(totalRows[0].totalAmount);
  
      // 分页查询
      const rows = await pool.query(
        `SELECT * 
          FROM coupon
          ${whereClause}
          ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
          LIMIT ?, ?`,
        [...whereParams, offset, limit]
      );
  
      // 准备响应数据
      const data = rows.map(row => ({
        ...row,
        valid_from: row.valid_from?formatDateTimeSync(row.valid_from):'',
        valid_to: row.valid_to?formatDateTimeSync(row.valid_to):'',
        create_time: formatDateTimeSync(row.create_time),
        usage_time: row.usage_time?formatDateTimeSync(row.usage_time):''
      }));
  
      // 发送 JSON 响应
      res.json({
        msg: 'success',
        code: 0,
        data: {
          total,
          totalAmount,
          size,
          current,
          records: data
        }
      });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch withdraw list.' , code: -500});
  }
}
//保存优惠码列表
const saveCouponList = async (req, res) => {
  const {data} = req.body;
  try {
    //保存修改后的数据
    const result = await pool.query('UPDATE coupon SET discount_type=?,discount_value=?,min_amount=?,cashback_amount=?,valid_from=?,valid_to=?,remark=? WHERE id =?', [data.discount_type,data.discount_value,data.min_amount,data.cashback_amount,data.valid_from,data.valid_to,data.remark,data.id]);
    if (result.affectedRows == 0) {
      return res.json({ msg:'failed', code: -1});
    }
    return res.json({ msg: 'success', code: 0});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//批量修改优惠码数据
const batchEditByGroupCoupon = async (req, res) => {
  const {ids,updates}= req.body;
  try{
    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ msg: '请提供有效的优惠券ID数组', code: -1 });
    }
    if (!updates || typeof updates !== 'object') {
      return res.json({ msg: '请提供有效的更新数据', code: -1 });
    }

    // 构建动态更新SQL
    const updateFields = [];
    const updateValues = [];
    
    if (updates.discount_type !== undefined) {
      updateFields.push('discount_type = ?');
      updateValues.push(updates.discount_type);
    }
    if (updates.discount_value !== undefined) {
      updateFields.push('discount_value = ?');
      updateValues.push(updates.discount_value);
    }
    if (updates.min_amount !== undefined) {
      updateFields.push('min_amount = ?');
      updateValues.push(updates.min_amount);
    }
    if (updates.cashback_amount !== undefined) {
      updateFields.push('cashback_amount = ?');
      updateValues.push(updates.cashback_amount);
    }
    if (updates.valid_from !== undefined) {
      updateFields.push('valid_from = ?');
      updateValues.push(updates.valid_from);
    }
    if (updates.valid_to !== undefined) {
      updateFields.push('valid_to = ?');
      updateValues.push(updates.valid_to);
    }
    if (updates.remark !== undefined) {
      updateFields.push('remark = ?');
      updateValues.push(updates.remark);
    }

    if (updateFields.length === 0) {
      return res.json({ msg: '没有提供需要更新的字段', code: -1 });
    }

    // 构建WHERE条件
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE coupon SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`;
    const params = [...updateValues, ...ids];

    // 执行批量更新
    const result = await pool.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.json({ msg: '没有找到匹配的优惠券或更新失败', code: -1 });
    }

    return res.json({ 
      msg: 'success', 
      code: 0,
      data: {
        updatedCount: result.affectedRows,
        totalIds: ids.length
      }
    });
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//批量保存优惠码列表
const saveCouponListBatch = async (req, res) => {
  const {data} = req.body;
  try {
    //批量保存修改后的数据
    const updatePromises = data.map(item => {
      return pool.query('UPDATE coupon SET discount_type=?,discount_value=?,min_amount=?,cashback_amount=?,valid_from=?,valid_to=?,remark=? WHERE id =?', [item.discount_type,item.discount_value,item.min_amount,item.cashback_amount,item.valid_from,item.valid_to,item.remark,item.id]);
    })
    await Promise.all(updatePromises);
    return res.json({ msg: 'success', code: 0});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

module.exports = {
  getPayOrderList, //获取支付订单列表
  getWithdrawList, //获取提现列表
  auditWithdrawOrder, //审核提现订单
  getUserOrderList, //获取收益核验列表
  getLastMonthOrder, //获取上月订单
  deleteLastMonthOrder, //批量删除月订单
  delUserOrder, //删除收益核验记录
  delUserOrderBatch, //批量删除收益核验记录
  passUserOrder, //收益核验审核通过
  batchPassUserOrder,//批量收益核验审核通过 通过id
  batchAuditUserOrder, //收益核验批量审核通过
  editUserOrder, //修改收益核验订单
  getDiscountApplyList, //获取申请优惠列表
  saveDiscountApplyList, //保存优惠码待审核列表
  saveOrderDescription, //保存订单备注
  updateDiscountApplyStatus, //更新申请优惠审核状态
  deleteDiscountApply, //删除申请优惠码数据
  getCouponList, //获取优惠码列表
  saveCouponList, //保存优惠码列表
  batchEditByGroupCoupon, //批量修改优惠码
  saveCouponListBatch, //批量保存优惠码列表
}
