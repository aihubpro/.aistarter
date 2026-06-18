const pool = require('../../database')
const fsPromises = require('fs').promises;
const fs = require('fs');
const { readConfig, writeConfig } = require('../../helpers/storage')
const { formatDateTimeSync, getPasswordEncrypt,verifyPassword,detectOperatingSystem } = require('../../helpers/functions')
const { verifyEmailCode } = require('../../helpers/verification')
const { getserverStatusText,getLicenseFileInfo } = require('../../helpers/license')
const menuData = require("../../datas/menu.data")
const aliOssDefaultCfgData = require("../../datas/oss_default_cfg_ali.data")
const Oss123DefaultCfgData = require("../../datas/oss_default_cfg_123.data");
const getUpdateInfoConfig = require("../../datas/get_version_info.data")
const getVersionUpdate = require("../../datas/get_version_update.data")
const getBannerInfoConfig = require("../../datas/get_banner_info.data")
const getShareInfoConfig = require("../../datas/get_share_info.data")
const shareHtml = require("../../datas/share_html.data")
const getCoConfig = require("../../datas/co_create_config_info.data")
const config = require('../../config')
const axios = require('axios')
const { KeyManager } = require('../../utils/utils');

const getUserInfo = async (req, res) => {

  const data = {}

  data.userId = req.user_id
  data.name = req.user_name
  data.username = req.user_email
  data.avatar = null

  return res.json({ msg: "success", data, code: 0 })

}

//获取菜单
const getMenuList = async (req, res) => {

  let data = {
    "resourcePerms": [],
    "menus": menuData
  }
  return res.json({ msg: "success", data, code: 0 })
}

//获取注册用户列表
const getRegUserList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', username, email,vip_type } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    // 获取总记录数
    const totalRows = await pool.query('SELECT COUNT(*) AS total FROM users');
    const total = Number(totalRows[0].total);


    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key]) {
          if(key === 'vip_type'){
            if(pool.escapeId(key) == 1){ //年度会员
              conditions.push(`${pool.escapeId(key)} = ? AND vip_expire_time > NOW()`);
              params.push(queryParams[key]);
            }else{
              conditions.push(`${pool.escapeId(key)} = ?`);
              params.push(queryParams[key]);
            }
          }else{
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
    const { whereClause, whereParams } = buildWhereClause({ username, email,vip_type });

    console.log(whereClause);

    // 分页查询
    const rows = await pool.query(
      `SELECT u.id, u.id_role, u.username, u.email, u.country,u.vip_type, u.vip_expire_time, u.phone, u.created_at, u.updated_at,
              IFNULL(ui.balance, 0) AS balance
       FROM users u
       LEFT JOIN users_info ui ON u.id = ui.user_id
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      vip_exp:row.vip_expire_time > Date.now(),
      created_at: formatDateTimeSync(row.created_at),
      updated_at: row.updated_at ? formatDateTimeSync(row.updated_at) : null
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch user list.', code: -500 });
  }
};
//获取待审核个人信息的用户
const getCreativeUserList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'update_time', asc = 'false', username, email,state } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    // 获取总记录数(待审核)
    const totalRows = await pool.query('SELECT COUNT(*) AS total FROM users_info WHERE state > 0');
    const total = Number(totalRows[0].total);


    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      // 固定条件：ui.state > 0 (填写后的才能展示搜索到)
      conditions.push("ui.state > 0");
      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if(key === 'state'){
            // 如果是state字段，则直接使用等于条件
            conditions.push(`${pool.escapeId(key)} =?`);
            params.push(queryParams[key]);
          }else{
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
    const { whereClause, whereParams } = buildWhereClause({ username, email,state });

    console.log(whereClause);

    // 分页查询
    const rows = await pool.query(
      `SELECT u.id, u.id_role, u.username, u.email,u.phone,ui.name,ui.id_card_number,ui.id_card_expiry_date,ui.id_card_front_image_url,ui.id_card_back_image_url,ui.wechat_image_url,ui.alipay_image_url,ui.bank_account_number,ui.bank_name,ui.paypal_id,ui.state,ui.update_time,ui.review_time
       FROM users u
       LEFT JOIN users_info ui ON u.id = ui.user_id
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      id_card_expiry_date: row.id_card_expiry_date ? formatDateTimeSync(row.id_card_expiry_date) : null,
      review_time: row.review_time ? formatDateTimeSync(row.review_time) : null,
      update_time: row.update_time ? formatDateTimeSync(row.update_time) : null
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch user list.', code: -500 });
  }
}
//设置待审核个人信息的用户状态
const setCreativeUserState = async (req, res) => {
  try {
    const { id, state } = req.body;
    const requst = await pool.query('UPDATE users_info SET state = ?,review_time=NOW() WHERE user_id = ?', [state, id]);
    if (requst.affectedRows === 0) {
      return res.json({ msg: 'User not found', code: -1 });
    }
    res.json({msg: 'success',code: 0});
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to update user state.', code: -500 });
  }
}

//获取用户详细信息
const getUserAllInfo = async (req, res) => {
  const {id} = req.query
  try {
    let data = {}
    const result = await pool.query(`
      SELECT ui.*, u.status, u.ban_expire_time,u.vip_type,u.vip_expire_time,u.reason,u.platform_fee,u.invite_commission_rate,u.	parent_invite_code,u.machine_code_change_count
      FROM users_info ui 
      LEFT JOIN users u ON ui.user_id = u.id 
      WHERE ui.user_id = ?
    `, [id]);
    if (result.length == 0) {
      // 相关内容不存在，则创建一个新的记录
      pool.query('INSERT INTO users_info (user_id) VALUES (?)', [id]);
      // 返回空对象
      return res.json({ msg: 'User not found', code: -1 });
    }
    data = {
      ...result[0],
      ban_expire_time: result[0].ban_expire_time ? formatDateTimeSync(result[0].ban_expire_time) : null,
    }
    return res.json({ msg: 'success', code: 0, data: data });
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//解绑邀请码
const unbindParentInviteCode = async (req,res) => {
  const {id} = req.body
  try {
    await pool.query(`
      UPDATE users SET parent_invite_code = NULL WHERE id = ?
    `, [id]);
    return res.json({ msg: 'success', code: 0 });
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//绑定邀请码
const bindParentInviteCode = async (req,res) => {
  const {id, parent_invite_code} = req.body
  try {
    //邀请码是否存在
    const result1 = await pool.query(`
      SELECT * FROM users WHERE invite_code = ?
    `, [parent_invite_code]);
    if(result1.length == 0){
      return res.json({ msg: '邀请码不存在', code: 500 });
    }
    //判断邀请码不能绑定自己
    const result = await pool.query(`
      SELECT * FROM users WHERE invite_code = ? AND id = ?
    `, [parent_invite_code, id]);
    if(result.length > 0){
      return res.json({ msg: '不能绑定自己', code: 500 });
    }
    await pool.query(`
      UPDATE users SET parent_invite_code = ? WHERE id = ?
    `, [parent_invite_code, id]);
    return res.json({ msg: 'success', code: 0 });
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//修改用户状态
const updateUserState = async (req, res) => {
  const {id, status, ban_expire_time,reason,vip_type,vip_expire_time,platform_fee,invite_commission_rate,machine_code_change_count} = req.body
  try {
    //修改users表
    await pool.query(`
      UPDATE users SET status = ?, ban_expire_time = ?,reason = ?,vip_type=?,vip_expire_time=?,platform_fee=?,invite_commission_rate=?,machine_code_change_count=? WHERE id = ?
    `, [status, ban_expire_time,reason,vip_type,vip_expire_time,platform_fee,invite_commission_rate,machine_code_change_count, id]);
    return res.json({ msg: 'success', code: 0 });
  }catch(e){
    console.error(e);
    res.json({ msg: 'Failed to update user state.', code: -500 });
  }
}

const getAIProjectList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', plugin_name, user_name, state,platforms } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key]) {
          conditions.push(`${pool.escapeId(key)} LIKE ?`);
          params.push(`%${queryParams[key]}%`);
        }
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({ plugin_name, user_name, state,platforms });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM upload ${whereClause}`, [...whereParams]);
    const total = Number(totalRows[0].total);

    // 分页查询
    const rows = await pool.query(
      `SELECT id, user_id, user_name, plugin_name, description, version, author, platforms, install_dir, like_count, download, project_zip_size, create_time, state ,price_type,price_value,image_path,public_option ,plugn_desc,cloud_storage_link,update_time,pan_123_path,need_device
       FROM upload
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
        size,
        current,
        records: data
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch upload list.', code: -500 });
  }
}

const getResList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', res_name, user_name, state,res_type,platforms } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key]) {
          conditions.push(`${pool.escapeId(key)} LIKE ?`);
          params.push(`%${queryParams[key]}%`);
        }
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({ res_name, user_name, state,res_type,platforms });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM upload_resources ${whereClause}`, [...whereParams]);
    const total = Number(totalRows[0].total);

    // 分页查询
    const rows = await pool.query(
      `SELECT id, user_id, user_name, res_name, short_desc, version, author, platforms, install_dir, like_count, download, res_zip_size, create_time, state ,price_type,price_value,res_type,res_install,image_path,ext_option ,res_desc,cloud_storage_link,update_time,pan_123_path
       FROM upload_resources
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
        size,
        current,
        records: data
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch upload list.', code: -500 });
  }
}

const delAIProjec = async (req, res) => {
  const { id } = req.query;
  const projectId = id; // 假设前端通过URL参数传递ID

  try {
    // 查询数据库以获取项目详情，包括安装目录和用户ID
    const projectDetails = await pool.query('SELECT * FROM upload WHERE id = ?', [projectId]);
    if (projectDetails.length === 0) {
      return res.json({ msg: 'Project not found', code: -404 });
    }

    const project = projectDetails[0];
    const userDir = './upload/' + project.user_id + "/";
    const filePath = userDir + project.install_dir + '.zip';
    const imgPath = './upload/'+project.image_path

    //删除脚本zip
    try {
      await fsPromises.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
    //删除图片
    try {
      await fsPromises.unlink(imgPath);
      console.log(`File deleted successfully: ${imgPath}`);
    }catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    // 删除数据库中的记录
    await pool.query('DELETE FROM upload WHERE id = ?', [projectId]);

    // 删除筛选表
    await pool.query('DELETE FROM upload_filter WHERE upload_id = ?', [projectId]);

    //删除点赞记录
    await pool.query('DELETE FROM user_like_records WHERE project_id = ? AND type = ?', [projectId,0]);
    //删除点赞消息记录
    await pool.query('DELETE FROM like_message WHERE project_id = ? AND project_type = ?', [projectId,0]);
    //删除收藏记录
    await pool.query('DELETE FROM project_favorite_records WHERE project_id = ? AND type = ?', [projectId,0]);

    //删除评论记录
    // 获取所有相关评论（包括子评论）
    const comments = await pool.query('SELECT * FROM comment WHERE project_id = ? AND project_type = ?', [projectId, 0]);
    
    // 删除评论中的图片文件
    const deleteCommentImages = async (commentContent) => {
      if (!commentContent) return;
      
      // 匹配 u-img 格式的图片URL
      // 单个图片格式: u-img[http://domain.com/assets/user-comment-images/4/1753782266711.png]
      // 多个图片格式: u-img[url1,url2,url3] (用逗号分隔)
      const blockRegex = /u-img\[([^\]]+)\]/g;
      let blockMatch;
      
      while ((blockMatch = blockRegex.exec(commentContent)) !== null) {
        const urlsString = blockMatch[1];
        // 分割多个URL（用逗号分隔）
        const urls = urlsString.split(',').map(url => url.trim());
        
        // 处理每个URL
        for (const url of urls) {
          // 从URL中提取userId和filename
          const urlMatch = url.match(/\/assets\/user-comment-images\/(\d+)\/(\d+\.png)/);
          if (urlMatch) {
            const userId = urlMatch[1];
            const filename = urlMatch[2];
            const imagePath = `./comment/${userId}/${filename}`;
            
            try {
              if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
                console.log(`Deleted comment image: ${imagePath}`);
              }
            } catch (error) {
              console.error(`Failed to delete comment image ${imagePath}:`, error);
            }
          }
        }
      }
    };
    
    // 删除所有评论的图片
    for (const comment of comments) {
      await deleteCommentImages(comment.content);
    }

    //删除评论消息记录
    await pool.query('DELETE FROM comment_message WHERE project_id = ? AND project_type = ?', [projectId,0]);
    
    // 删除评论的点赞记录
    await pool.query('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, 0]);
    
    // 删除评论的举报记录
    await pool.query('DELETE FROM comment_reports WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, 0]);
    
    // 删除评论记录
    await pool.query('DELETE FROM comment WHERE project_id = ? AND project_type = ?', [projectId, 0]);

    res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}

const delRes = async (req, res) => {
  const { id } = req.query;
  const projectId = id; // 假设前端通过URL参数传递ID

  try {
    // 查询数据库以获取项目详情，包括安装目录和用户ID
    const projectDetails = await pool.query('SELECT * FROM upload_resources WHERE id = ?', [projectId]);
    if (projectDetails.length === 0) {
      return res.json({ msg: 'Project not found', code: -404 });
    }

    const project = projectDetails[0];
    let resType = 'model'
    switch (project.res_type) {
      case '1':
        resType = 'model';
        break;
      case '2':
        resType = 'plugin';
        break;
      case '3':
        resType = 'workflow';
        break;
    }
    const userDir = './upload/' + resType + '/' + project.user_id + "/";
    const filePath = userDir + project.install_dir + '.zip';
    const imgPath = './upload/'+project.image_path

    //删除脚本zip
    try {
      await fsPromises.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
    //删除图片
    try {
      await fsPromises.unlink(imgPath);
      console.log(`File deleted successfully: ${imgPath}`);
    }catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    // 删除数据库中的记录
    await pool.query('DELETE FROM upload_resources WHERE id = ?', [projectId]);

    // 删除筛选表
    await pool.query('DELETE FROM upload_resources_filter WHERE upload_id = ?', [projectId]);

    //删除点赞记录
    await pool.query('DELETE FROM user_like_records WHERE project_id = ? AND type = ?', [projectId,project.res_type]);
    //删除点赞消息记录
    await pool.query('DELETE FROM like_message WHERE project_id = ? AND project_type = ?', [projectId,project.res_type]);
    //删除收藏记录
    await pool.query('DELETE FROM project_favorite_records WHERE project_id = ? AND type = ?', [projectId,project.res_type]);

          //删除评论记录
    // 获取所有相关评论（包括子评论）
    const comments = await pool.query('SELECT * FROM comment WHERE project_id = ? AND project_type = ?', [projectId, project.res_type]);
    
    // 删除评论中的图片文件
    const deleteCommentImages = async (commentContent) => {
      if (!commentContent) return;
      
      // 匹配 u-img 格式的图片URL
      // 单个图片格式: u-img[http://domain.com/assets/user-comment-images/4/1753782266711.png]
      // 多个图片格式: u-img[url1,url2,url3] (用逗号分隔)
      const blockRegex = /u-img\[([^\]]+)\]/g;
      let blockMatch;
      
      while ((blockMatch = blockRegex.exec(commentContent)) !== null) {
        const urlsString = blockMatch[1];
        // 分割多个URL（用逗号分隔）
        const urls = urlsString.split(',').map(url => url.trim());
        
        // 处理每个URL
        for (const url of urls) {
          // 从URL中提取userId和filename
          const urlMatch = url.match(/\/assets\/user-comment-images\/(\d+)\/(\d+\.png)/);
          if (urlMatch) {
            const userId = urlMatch[1];
            const filename = urlMatch[2];
            const imagePath = `./comment/${userId}/${filename}`;
            
            try {
              if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
                console.log(`Deleted comment image: ${imagePath}`);
              }
            } catch (error) {
              console.error(`Failed to delete comment image ${imagePath}:`, error);
            }
          }
        }
      }
    };
    
    // 删除所有评论的图片
    for (const comment of comments) {
      await deleteCommentImages(comment.content);
    }

    //删除评论消息记录
    await pool.query('DELETE FROM comment_message WHERE project_id = ? AND project_type = ?', [projectId,project.res_type]);
    
    // 删除评论的点赞记录
    await pool.query('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, project.res_type]);
    
    // 删除评论的举报记录
    await pool.query('DELETE FROM comment_reports WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, project.res_type]);
    
    // 删除评论记录
    await pool.query('DELETE FROM comment WHERE project_id = ? AND project_type = ?', [projectId, project.res_type]);

    res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}

const setProjectReviewStatus = async (req, res) => {
  const { id, state } = req.query;

  // 验证state值
  if (state !== '0' && state !== '1') {
    return res.json({ msg: 'Invalid state value. State must be 0 or 1.', code: -400 });
  }

  try {
    // 更新数据库中项目的审核状态
    const result = await pool.query('UPDATE upload SET state = ? WHERE id = ?', [state, id]);

    if (result.affectedRows === 0) {
      return res.json({ msg: 'Project not found or no rows affected', code: -404 });
    }

    res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}

const setResReviewStatus = async (req, res) => {
  const { id, state } = req.query;

  // 验证state值
  if (state !== '0' && state !== '1') {
    return res.json({ msg: 'Invalid state value. State must be 0 or 1.', code: -400 });
  }

  try {
    // 更新数据库中项目的审核状态
    const result = await pool.query('UPDATE upload_resources SET state = ? WHERE id = ?', [state, id]);

    if (result.affectedRows === 0) {
      return res.json({ msg: 'Project not found or no rows affected', code: -404 });
    }

    res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}


//获取首页统计数据
const getDashBoardInfo = async (req, res) => {
  try {
    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(amount) AS totalAmount FROM pay_order WHERE status = 1`);
    const total = Number(totalRows[0].total);
    const totalAmount = Number(totalRows[0].totalAmount / 100);

    // 会员统计
    const menberRows = await pool.query(`SELECT COUNT(*) AS total FROM users`);
    const menberCount = Number(menberRows[0].total);


    let data = {};
    data.payAmount = totalAmount;
    data.orderCount = total;
    data.menberCount = menberCount;
    if(config.IS_PARENT){
      //共创者统计
      const coMenberRows = await pool.query(`SELECT COUNT(*) AS total FROM collaborator`);
      const coMenberCount = Number(coMenberRows[0].total);

      //共创者过期统计
      const coMenberExpireRows = await pool.query(`SELECT COUNT(*) AS total FROM collaborator WHERE expiry_time < NOW()`);
      const coMenberExpireCount = Number(coMenberExpireRows[0].total);
      data.coMenberCount = coMenberCount;
      data.coMenberExpireCount = coMenberExpireCount;
    }

    res.json({ data, code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}

//获取OSS阿里平台配置
const getOssAliConfig = async (req, res) => {

  let data = null;
  let aliossCfg = await readConfig("oss_cfg_ali");
  if (!aliossCfg) {
    aliossCfg = aliOssDefaultCfgData
  }

  data = aliossCfg

  return res.json({ msg: "success", data, code: 0 })

}

//更新OSS阿里平台配置
const updateOssAliConfig = async (req, res) => {
  const data = req.body
  await writeConfig("oss_cfg_ali", data);
  return res.json({ msg: "success", code: 0 })

}

//获取OSS123网盘平台配置
const getOss123Config = async (req, res) => {

  let data = null;
  let ossCfg123 = await readConfig("oss_cfg_123");
  if (!ossCfg123) {
    ossCfg123 = Oss123DefaultCfgData
  }

  data = ossCfg123

  return res.json({ msg: "success", data, code: 0 })

}

//更新OSS123网盘平台配置
const updateOss123Config = async (req, res) => {
  const data = req.body
  await writeConfig("oss_cfg_123", data);
  return res.json({ msg: "success", code: 0 })

}


//项目更新相关配置
const updateAIProject = async (req, res) => {
  const { id, description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, image_path, pan_123_path, device } = req.body

  try {
    if (image_path != null) {
      await pool.query('UPDATE upload SET description = ?,plugn_desc = ?,cloud_storage_link = ?,public_option = ?, price_type = ?, price_value = ?,image_path = ?, pan_123_path = ?, need_device = ? WHERE id = ?', [description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, image_path, pan_123_path, device, id])
    } else {
      // 更新数据库中项目的审核状态
      await pool.query('UPDATE upload SET description = ?,plugn_desc = ?,cloud_storage_link = ?,public_option = ?, price_type = ?, price_value = ?,pan_123_path = ?, need_device = ? WHERE id = ?', [description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, pan_123_path, device, id])
    }
    return res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error("Error updateAIProject:", error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//模型，插件，工作流更新相关配置
const updateRes= async (req, res) => {
  const { id, short_desc, res_desc, cloud_storage_link, ext_option, price_type, price_value, image_path, pan_123_path,resInstall } = req.body

  try {
    if (image_path != null) {
      await pool.query('UPDATE upload_resources SET short_desc = ?,res_desc = ?,cloud_storage_link = ?,ext_option = ?, price_type = ?, price_value = ?,image_path = ?, pan_123_path = ?,res_install = ? WHERE id = ?', [short_desc, res_desc, cloud_storage_link, ext_option, price_type, price_value, image_path, pan_123_path,resInstall, id])
    } else {
      // 更新数据库中项目的审核状态
      await pool.query('UPDATE upload_resources SET short_desc = ?,res_desc = ?,cloud_storage_link = ?,ext_option = ?, price_type = ?, price_value = ?,pan_123_path = ?,res_install = ? WHERE id = ?', [short_desc, res_desc, cloud_storage_link, ext_option, price_type, price_value, pan_123_path,resInstall, id])
    }
    return res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error("Error updateAIProject:", error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//更新项目筛选数据
const updateAIProjectFilter = async (req, res) => {
  const { id, filter_data, filter_key } = req.query;

  // 输入验证
  if (!id || !filter_data || !filter_key) {
    return res.json({ msg: 'Invalid input', code: -400 });
  }
  const updateAIProjectFilterFun = async (id, filter_data, filter_key) => {
    try {
      //删除旧记录
      const deleteResult = await pool.query('DELETE FROM upload_filter WHERE upload_id = ? AND filter_key = ?', [id, filter_key]);
      // 检查是否有记录被删除
      if (deleteResult.affectedRows === 0) {
        // 根据业务需求决定如何处理
        console.warn('No records were deleted.');
        // 可以选择返回提示信息或者继续执行插入操作
      }
  
      // 如果更新没有影响行，则插入新记录
      //filter_data 如果多数据，则拆分插入
      if (filter_data.indexOf(",") != -1) {
        const filter_data_array = filter_data.split(",")
        for (let i = 0; i < filter_data_array.length; i++) {
          const filter_data_item = filter_data_array[i]
          const insertResult = await pool.query(
            'INSERT INTO upload_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
            [id, filter_key, filter_data_item]
          );
          if (insertResult.affectedRows === 0) {
            return { msg: `Insert failed ${filter_data_item}`, code: 100 }
          }
        }
      }else{
        const insertResult = await pool.query(
          'INSERT INTO upload_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
          [id, filter_key, filter_data]
        );
        if (insertResult.affectedRows === 0) {
          return { msg: `Insert failed ${filter_data}`, code: 100 }
        }
      }
      return { msg: 'success', code: 0 }
    } catch (error) {
      console.error('Error updating upload_filter:',error);
      return { msg: 'Database error Filter', code: -500 }
    }
  }
  const result = await updateAIProjectFilterFun(id, filter_data, filter_key)
  return res.json(result)
  
}
//更新（模型，插件，工作流）筛选数据
const updateResFilter = async (req, res) => {
  const { id, filter_data, filter_key } = req.query;

  // 输入验证
  if (!id || !filter_data || !filter_key) {
    return res.json({ msg: 'Invalid input', code: -400 });
  }
  const updateResFilterFun = async (id, filter_data, filter_key) => {
    try {
      //删除旧记录
      const deleteResult = await pool.query('DELETE FROM upload_resources_filter WHERE upload_id = ? AND filter_key = ?', [id, filter_key]);
      // 检查是否有记录被删除
      if (deleteResult.affectedRows === 0) {
        // 根据业务需求决定如何处理
        console.warn('No records were deleted.');
        // 可以选择返回提示信息或者继续执行插入操作
      }
  
      // 如果更新没有影响行，则插入新记录
      //filter_data 如果多数据，则拆分插入
      if (filter_data.indexOf(",") != -1) {
        const filter_data_array = filter_data.split(",")
        for (let i = 0; i < filter_data_array.length; i++) {
          const filter_data_item = filter_data_array[i]
          const insertResult = await pool.query(
            'INSERT INTO upload_resources_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
            [id, filter_key, filter_data_item]
          );
          if (insertResult.affectedRows === 0) {
            return { msg: `Insert failed ${filter_data_item}`, code: 100 }
          }
        }
      }else{
        const insertResult = await pool.query(
          'INSERT INTO upload_resources_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
          [id, filter_key, filter_data]
        );
        if (insertResult.affectedRows === 0) {
          return { msg: `Insert failed ${filter_data}`, code: 100 }
        }
      }
      return { msg: 'success', code: 0 }
    } catch (error) {
      console.error('Error updating upload_resources_filter:',error);
      return { msg: 'Database error Filter', code: -500 }
    }
  }
  const result = await updateResFilterFun(id, filter_data, filter_key)
  return res.json(result)
  
}
//删除AI项目筛选数据
const deleteAIProjectFilter = async (req, res) => {
  const { id, filter_key } = req.query
  try {
    // 删除数据库中的记录
    await pool.query('DELETE FROM upload_filter WHERE upload_id = ? AND filter_key = ?', [id, filter_key]);
    return res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error('Error deleting upload_filter:', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//删除（模型，插件，工作流）筛选数据
const deleteResFilter = async (req, res) => {
  const { id, filter_key } = req.query
  try {
    // 删除数据库中的记录
    await pool.query('DELETE FROM upload_resources_filter WHERE upload_id = ? AND filter_key = ?', [id, filter_key]);
    return res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error('Error deleting upload_resources_filter:', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//根据id获取筛选数据
const getAIProjectFilter = async (req, res) => {
  try {
    const { id } = req.query
    const result = await pool.query(`SELECT * FROM upload_filter WHERE upload_id = ${id}`)
    return res.json({ data: result, code: 0 })
  } catch (error) {
    console.error('Error geting upload_filter:', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}

//根据id获取（模型，插件，工作流）筛选数据
const getResFilter = async (req, res) => {
  try {
    const { id } = req.query
    const result = await pool.query(`SELECT * FROM upload_resources_filter WHERE upload_id = ${id}`)
    return res.json({ data: result, code: 0 })
  } catch (error) {
    console.error('Error geting upload_resources_filter:', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}

//上传图片
const uploadImage = async (req, res) => {
  try {
    // console.log(req)
    const { userid, oldimageurl, installDir} = req.body
    const file = req.files
    // const fileName = file.image.name
    let userDir = './upload/' + userid + "/";
    //创建用户目录
    if (!fs.existsSync(userDir)) {
      try {
        await mkdir(userDir, { recursive: true }); // 使用 recursive 选项确保创建整个目录路径
      } catch (error) {
        console.error("Failed to create user directory:", error);
        res.status(400).json({
          error: 'Failed to create user directory'
        });
        return;
      }
    }
  
    //上传图片到某个位置
    let imagePath = userDir + installDir+ '.png';
    let imageObj = req.files.image;
    imageObj.mv(imagePath, async (err) => {
      if(err){
        console.error("Update load image error:" + imagePath);
      }
    });
    const fileUrl = userid + '/'  + installDir +'.png'
    // console.log(filePath)

    return res.json({ msg: 'succus', data: fileUrl, code: 0 });
  } catch (error) {
    console.error("Upload image error:" + error)
    return res.json({ msg: 'Upload Image Error', code: -500 });
  }
}

//上传图片(模型，插件，工作流)
const uploadImageRes = async (req, res) => {
  try {
    // console.log(req)
    const { userid, resType, installDir} = req.body
    const file = req.files
    // const fileName = file.image.name
    let userDir = './upload/'+resType+'/' + userid + "/";
    //创建用户目录
    if (!fs.existsSync(userDir)) {
      try {
        await mkdir(userDir, { recursive: true }); // 使用 recursive 选项确保创建整个目录路径
      } catch (error) {
        console.error("Failed to create user directory:", error);
        res.status(400).json({
          error: 'Failed to create user directory'
        });
        return;
      }
    }
  
    //上传图片到某个位置
    let imagePath = userDir + installDir+ '.png';
    let imageObj = req.files.image;
    imageObj.mv(imagePath, async (err) => {
      if(err){
        console.error("Update load image error:" + imagePath);
      }
    });
    const fileUrl = resType+ '/' + userid + '/'  + installDir +'.png'
    // console.log(filePath)

    return res.json({ msg: 'succus', data: fileUrl, code: 0 });
  } catch (error) {
    console.error("Upload image error:" + error)
    return res.json({ msg: 'Upload Image Error', code: -500 });
  }
}

//重置密码
const resetPassword = async (req, res) => {
  try {
    const { userid, password } = req.body
    const passwordEncrypt = await getPasswordEncrypt(password);
    // 更新数据库中项目的审核状态
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [passwordEncrypt, userid])
    return res.json({ msg: 'sucess', data: passwordEncrypt, code: 0 });
  } catch (error) {
    console.error('Error resetPassword', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}

//前端忘记密码修改密码
const forgotPasswordByEmail = async (req, res) => {
  //1、调用前端注册发送验证码接口发送验证码
  //2、调用verifyEmailCode检验验证码有效性
  //code 0：成功，-1：验证码错误，-500：数据库错误
  const { email, code, password } = req.body;
  const verifyResult = verifyEmailCode(email, code);
  if (!verifyResult.success) {
    return res.json({ msg: 'Email or code error', code: -1 });
  }
  try {
    const passwordEncrypt = await getPasswordEncrypt(password);
    //查询是否有该用户
    const result = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (result.length == 0) {
      return res.json({ msg: 'Email not exist', code: -2 });
    }
    // 更新数据库中项目的审核状态
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [passwordEncrypt, email])
    return res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error('Error forgotPasswordByEmail:', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}

//前端修改密码
const changePassword = async (req, res) => {
  const { oldpassword, password } = req.body;
  try {
    const passwordEncrypt = await getPasswordEncrypt(password);
    
    //查询是否有该用户
    const result = await pool.query('SELECT * FROM users WHERE id = ?', [req.user_id])
    if(result.length == 0 && result.length > 1){
      return res.json({ msg: 'User not exist', code: -2 });
    }
    //判断旧密码是否正确
    const oldpasswordEncrypt = await verifyPassword(oldpassword,result[0].password);
    if (!oldpasswordEncrypt) {
      return res.json({ msg: 'Old password error', code: -2 });
    }
    
    // 更新数据库中项目的审核状态
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [passwordEncrypt, req.user_id])
    return res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error('Error forgotPasswordByEmail:', error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}

//后端接口 获取更新信息
const getVersionInfo = async (req, res) => {
  let result = {};
  result.updateInfo = getUpdateInfoConfig;
  try {
    // 获取版本更新信息
    let update = await readConfig("app_info_cfg_force_update");
    if (!update) {
      update.updateInfo = getUpdateInfoConfig;
    }
    result.updateInfo = update.updateInfo;
    return res.json({ msg: 'success', data: result, code: 0 });
  } catch (error) {
    console.error('Error getVersionInfo:', error);
    return res.json({ msg: 'not data',data:result, code: 0 });
  }
};
//后端接口 获取更新信息2
const getVersionInfo2 = async (req, res) => {
  let result = {};
  result = getVersionUpdate;
  try {
    // 获取版本更新信息
    let update = await readConfig("app_info_cfg_update");
    if (!update) {
      update = getVersionUpdate;
    }
    result = update;
    return res.json({ msg: 'success', data: result, code: 0 });
  } catch (error) {
    console.error('Error getVersionInfo2:', error);
    return res.json({ msg: 'not data',data:result, code: 0 });
  }
}
//后端接口 获取轮播图信息
const getBannerInfo = async (req, res) => {
  let result = {};
  result.bannerInfo = getBannerInfoConfig;
  try {
    // 获取轮播图数据
    let banner = await readConfig("app_info_cfg_home_banner");
    if (!banner) {
      banner.bannerInfo = getBannerInfoConfig;
    }
    result.bannerInfo = banner.bannerInfo;
    return res.json({ msg: 'success', data: result, code: 0 });
  }catch (error) {
    console.error('Error getBannerInfo:', error);
    return res.json({ msg: 'not data',data:result, code: 0 });
  }
}


//前端接口
//获取新版本更新信息，以及轮播图等……
const getAppInfo = async (req, res) => {
  function compareVersions(version1, version2) {
    // 将版本号按'.'分割成数组
    let v1Parts = version1.split('.').map(Number);
    let v2Parts = version2.split('.').map(Number);

    // 获取两个数组的最大长度
    let maxLength = Math.max(v1Parts.length, v2Parts.length);

    // 比较每个部分
    for (let i = 0; i < maxLength; i++) {
      // 如果v1Parts[i]不存在，则视为0
      let v1Part = v1Parts[i] || 0;
      let v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) {
        return 1; // version1 大于 version2
      } else if (v1Part < v2Part) {
        return -1; // version1 小于 version2
      }
    }

    // 如果所有部分都相等，则版本号相同
    return 0;
  }

  const { version } = req.query;
  let result = {};

  try {
    // 获取轮播图数据
    let banner = await readConfig("app_info_cfg_home_banner");
    if (banner) {
      result.bannerInfo = banner.bannerInfo.map(({id,image,urlHref})=>({id,image,urlHref}));
    }

    // 获取版本更新信息
    let update = await readConfig("app_info_cfg_force_update");
    if (version && update) {
      if (compareVersions(update.updateInfo.version, version) == 1) {
        result.updateInfo = update.updateInfo;
      }
    }
    // 非强制更新版本信息
    let update2 = await readConfig("app_info_cfg_update");
    if (version && update2) {
      if (compareVersions(update2.version, version) == 1) {
        result.newupdate = {version:update2.version,content:update2.content};
      }
    }
    let serverstatus = await getserverStatusText()
    if(serverstatus==4){
      //链接到主公司服务器的更新信息
      result.updateInfo = {
        "version":"update",
        "content":"尊敬的用户：\n您好！\n由于某共创者部署的服务器已长时间未续费维护，为保障服务稳定性和后续更新支持，原开发公司决定对该共创者部署的软件进行统一升级迁移。\n请您配合完成相关迁移或更新操作。如您在操作过程中遇到任何问题，请随时联系客服人员，我们将为您提供协助。\n感谢您的理解与支持！",
        "urllink":"https://aistarter.cc/"
      }
    }
    return res.json({ msg: "success", data: result,version:update.updateInfo.version, code: 0 });
  } catch (error) {
    console.error("Error getAppInfo:", error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//修改新版本更新信息
const updateNewVersionInfo = async (req, res) => {
  const { updateInfo } = req.body
  await writeConfig("app_info_cfg_force_update", { updateInfo });
  return res.json({ msg: "success", code: 0 })
}
//修改新版本更新信息2
const updateNewVersionInfo2 = async (req, res) => {
  const { updateInfo } = req.body
  await writeConfig("app_info_cfg_update", updateInfo);
  return res.json({ msg: "success", code: 0 })
}


//轮播图图片上传
const bannerUpload = async (req, res) => {
  //设置请求头以确保中文文件名可以获取
  const file = req.files
  const fileName = file.file.name
  const fileName2 = 'banner_' + new Date().getTime() + '.png'
  //判断./upload/bannerImg/目录是否存在
  const targetBannerDir = './upload/bannerImg/';
  if (!fs.existsSync(targetBannerDir)) {
    try {
      await fsPromises.mkdir(targetBannerDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create banner directory:", error);
      res.status(400).json({
        error: 'Failed to create banner directory'
      });
      return;
    }
  }
  const filePath = targetBannerDir + fileName2
  const imageUrl = 'bannerImg/' + fileName2;
  try {
    file.file.mv(filePath, async (err) => {
      if (err) {
        console.log("Update load image error:" + filePath)
      }
    })
    return res.json({ msg: "success", data: {oldname: fileName, name: fileName2, imageUrl: imageUrl }, code: 0 })
  } catch (error) {
    console.error("Upload Image Error:", error);
    return res.json({ msg: 'Upload Image Error', code: -500 });
  }
}

//修改轮播图信息
const updateBannerInfo = async (req, res) => {
  const { bannerInfo } = req.body
  //判断./upload/bannerImg/目录是否存在
  const targetBannerDir = './upload/bannerImg/';
  if (!fs.existsSync(targetBannerDir)) {
    try {
      await fsPromises.mkdir(targetBannerDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create banner directory:", error);
      res.status(400).json({
        error: 'Failed to create banner directory'
      });
      return;
    }
  }
  //获取./upload/bannerImg/下的所有图片
  try{
    const files = await fsPromises.readdir(targetBannerDir);
    files.forEach(async (file) => {
      let flag = true
      bannerInfo.forEach(item => {
        if (item.name == file) {
          flag = false
        }
      })
      if (flag) {
        await fsPromises.unlink(targetBannerDir + file)
      }
    });
  }catch (error) {
    console.error("Failed to delete banner image:", error);
    return res.json({ msg: 'Database error', code: -500 });
  }
  
  await writeConfig("app_info_cfg_home_banner", { bannerInfo });
  return res.json({ msg: "success", code: 0 })
}

//前端用户项目数据
const getUserProjectData = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', plugin_name, platforms, state } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    // const totalRows = await pool.query(`
    //   SELECT
    //     (SELECT COUNT(*) FROM upload     WHERE user_id = ${req.user_id}) AS upload_count,
    //       (SELECT COUNT(*) FROM upload_tmp t
    //         WHERE t.user_id = ${req.user_id}
    //           AND NOT EXISTS (
    //             SELECT 1
    //             FROM upload u
    //             WHERE u.user_id = t.user_id AND u.install_dir = t.install_dir
    //           )) AS tmp_count;
    // `);

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if(key === 'state' || key === 'platforms'){
            // 如果是state字段，则直接使用等于条件
            conditions.push(`${pool.escapeId(key)} =?`);
            params.push(queryParams[key]);
          }else{
            conditions.push(`${pool.escapeId(key)} LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }
        }
        // if (queryParams.hasOwnProperty(key) && queryParams[key]) {
        //   conditions.push(`${pool.escapeId(key)} LIKE ?`);
        //   params.push(`%${queryParams[key]}%`);
        // }
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({ plugin_name, platforms, state });

    console.log(whereClause);

      // 获取总记录数
      const totalRows = await pool.query(`
        SELECT COUNT(*) AS total FROM (
          SELECT 
            u.id, u.state, u.plugin_name, u.platforms, u.user_id
          FROM upload_tmp u
          WHERE u.user_id = ?
          
          UNION ALL
          
          SELECT 
            t.id, t.state, t.plugin_name, t.platforms, t.user_id
          FROM upload t
          WHERE t.user_id = ?
            AND NOT EXISTS (
              SELECT 1
              FROM upload_tmp u
              WHERE u.user_id = t.user_id AND u.install_dir = t.install_dir
            )
        ) AS combined
        ${whereClause}
      `,[ req.user_id,req.user_id,...whereParams]);
      const total = Number(totalRows[0].total)||0;

    // 分页查询
    // const rows = await pool.query(
    //   `SELECT id,user_id,user_name,plugin_name,description,version,platforms,like_count,download,state,plugn_desc,public_option,cloud_storage_link FROM upload WHERE user_id = ${req.user_id}
    //    ${whereClause}
    //    ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
    //    LIMIT ?, ?`,
    //   [...whereParams, offset, limit]
    // );
    const rows = await pool.query(
      `SELECT * FROM (
        SELECT 
          u.id, u.user_id, u.user_name, u.plugin_name, u.description, 
          u.version, u.platforms, u.like_count, u.download, u.state, 
          u.plugn_desc, u.public_option, u.cloud_storage_link, true as istmp,0 as favorite_count
        FROM upload_tmp u
        WHERE u.user_id = ?
        
        UNION ALL
        
        SELECT 
          t.id, t.user_id, t.user_name, t.plugin_name, t.description, 
          t.version, t.platforms, t.like_count, t.download, t.state, 
          t.plugn_desc, t.public_option, t.cloud_storage_link, false as istmp,t.favorite_count
        FROM upload t
        WHERE t.user_id = ?
          AND NOT EXISTS (
            SELECT 1
            FROM upload_tmp u
            WHERE u.user_id = t.user_id AND u.install_dir = t.install_dir
          )
      ) AS combined
      ${whereClause}
      ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
      LIMIT ?, ?`,
      [ req.user_id,req.user_id,...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch upload list.', code: -500 });
  }
}

//前端用户项目数据删除
const deleteUserProjectData = async (req, res) => {
  const { id,temp } = req.body;
  const projectId = id; // 假设前端通过URL参数传递ID

  try {
    // 查询数据库以获取项目详情，包括安装目录和用户ID
    let projectDetails;
    let userDir;
    let project;
    if (!temp) { //非临时项目
      projectDetails = await pool.query('SELECT * FROM upload WHERE id = ? AND user_id = ?', [projectId, req.user_id]);
      if (projectDetails.length === 0) {
        return res.json({ msg: 'Project not found', code: -404 });
      }
      project = projectDetails[0];
      userDir = './upload/' + project.user_id + "/";
    }else{ //临时项目
      projectDetails = await pool.query('SELECT * FROM upload_tmp WHERE id = ? AND user_id = ?', [projectId, req.user_id]);
      if (projectDetails.length === 0) {
        return res.json({ msg: 'tmp Project not found', code: -404 });
      }
      project = projectDetails[0];
      userDir = './upload_tmp/' + project.user_id + "/";
    }
    const filePath = userDir + project.install_dir + '.zip';
    const imagePath = userDir + project.install_dir + '.png';
    //删除项目图片
    try {
      await fsPromises.unlink(imagePath);
      console.log(`File deleted successfully: ${imagePath}`);
    }catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    //删除脚本zip
    try {
      await fsPromises.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    // 删除数据库中的记录
    if (!temp) {
      await pool.query('DELETE FROM upload WHERE id = ?', [projectId]);
      //删除点赞记录
      await pool.query('DELETE FROM user_like_records WHERE project_id = ? AND type = ?', [projectId,0]);
      //删除点赞消息记录
      await pool.query('DELETE FROM like_message WHERE project_id = ? AND project_type = ?', [projectId,0]);
      //删除收藏记录
      await pool.query('DELETE FROM project_favorite_records WHERE project_id = ? AND type = ?', [projectId,0]);

            //删除评论记录
      // 获取所有相关评论（包括子评论）
      const comments = await pool.query('SELECT * FROM comment WHERE project_id = ? AND project_type = ?', [projectId, 0]);
      
      // 删除评论中的图片文件
      const deleteCommentImages = async (commentContent) => {
        if (!commentContent) return;
        
        // 匹配 u-img 格式的图片URL
        // 单个图片格式: u-img[http://domain.com/assets/user-comment-images/4/1753782266711.png]
        // 多个图片格式: u-img[url1,url2,url3] (用逗号分隔)
        const blockRegex = /u-img\[([^\]]+)\]/g;
        let blockMatch;
        
        while ((blockMatch = blockRegex.exec(commentContent)) !== null) {
          const urlsString = blockMatch[1];
          // 分割多个URL（用逗号分隔）
          const urls = urlsString.split(',').map(url => url.trim());
          
          // 处理每个URL
          for (const url of urls) {
            // 从URL中提取userId和filename
            const urlMatch = url.match(/\/assets\/user-comment-images\/(\d+)\/(\d+\.png)/);
            if (urlMatch) {
              const userId = urlMatch[1];
              const filename = urlMatch[2];
              const imagePath = `./comment/${userId}/${filename}`;
              
              try {
                if (fs.existsSync(imagePath)) {
                  await fs.promises.unlink(imagePath);
                  console.log(`Deleted comment image: ${imagePath}`);
                }
              } catch (error) {
                console.error(`Failed to delete comment image ${imagePath}:`, error);
              }
            }
          }
        }
      };
      
      // 删除所有评论的图片
      for (const comment of comments) {
        await deleteCommentImages(comment.content);
      }
      //删除评论消息记录
      await pool.query('DELETE FROM comment_message WHERE project_id = ? AND project_type = ?', [projectId,0]);
      
      // 删除评论的点赞记录
      await pool.query('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, 0]);
      
      // 删除评论的举报记录
      await pool.query('DELETE FROM comment_reports WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, 0]);
      
      // 删除评论记录
      await pool.query('DELETE FROM comment WHERE project_id = ? AND project_type = ?', [projectId, 0]);
    }else{
      await pool.query('DELETE FROM upload_tmp WHERE id = ?', [projectId]);
    }


    res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}
//前端用户资源数据
const getUserResourcesData = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', res_name, platforms,res_type, state } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if(key === 'state' || key === 'platforms' || key === 'res_type'){
            // 如果是state字段，则直接使用等于条件
            conditions.push(`${pool.escapeId(key)} =?`);
            params.push(queryParams[key]);
          }else{
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
    const { whereClause, whereParams } = buildWhereClause({ res_name, platforms,res_type, state });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`
      SELECT COUNT(*) AS total FROM (
        SELECT 
          u.id, u.state, u.res_name, u.platforms,u.res_type, u.user_id
        FROM upload_resources_tmp u
        WHERE u.user_id = ?
        
        UNION ALL
        
        SELECT 
          t.id, t.state, t.res_name, t.platforms,t.res_type, t.user_id
        FROM upload_resources t
        WHERE t.user_id = ?
          AND NOT EXISTS (
            SELECT 1
            FROM upload_resources_tmp u
            WHERE u.user_id = t.user_id AND u.install_dir = t.install_dir
          )
      ) AS combined
      ${whereClause}
    `,[ req.user_id,req.user_id,...whereParams]);
    const total = Number(totalRows[0].total)||0;
    // 分页查询
    const rows = await pool.query(
      `SELECT * FROM (
        SELECT 
          u.id, u.user_id, u.user_name, u.res_name, u.short_desc, u.res_type, 
          u.version, u.platforms, u.like_count, u.download, u.state, 
          u.res_desc, u.ext_option, u.cloud_storage_link, true as istmp,0 as favorite_count
        FROM upload_resources_tmp u
        WHERE u.user_id = ?
        
        UNION ALL
        
        SELECT 
          t.id, t.user_id, t.user_name, t.res_name, t.short_desc, t.res_type, 
          t.version, t.platforms, t.like_count, t.download, t.state, 
          t.res_desc, t.ext_option, t.cloud_storage_link, false as istmp,t.favorite_count
        FROM upload_resources t
        WHERE t.user_id = ?
          AND NOT EXISTS (
            SELECT 1
            FROM upload_resources_tmp u
            WHERE u.user_id = t.user_id AND u.install_dir = t.install_dir
          )
      ) AS combined
      ${whereClause}
      ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
      LIMIT ?, ?`,
      [ req.user_id,req.user_id,...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch upload list.', code: -500 });
  }
}
//前端用户资源数据删除
const deleteUserResourcesData = async (req, res) => {
  const { id,temp,res_type } = req.body;
  const projectId = id; // 假设前端通过URL参数传递ID

  try {
    // 查询数据库以获取项目详情，包括安装目录和用户ID
    let projectDetails;
    let userDir;
    let project;
    let resType = 'model'
    switch (res_type) {
      case '1':
        resType = 'model';
        break;
      case '2':
        resType = 'plugin';
        break;
      case '3':
        resType = 'workflow';
        break;
    }
    if (!temp) { //非临时项目
      projectDetails = await pool.query('SELECT * FROM upload_resources WHERE id = ? AND user_id = ?', [projectId, req.user_id]);
      if (projectDetails.length === 0) {
        return res.json({ msg: 'Project not found', code: -404 });
      }
      project = projectDetails[0];
      userDir = './upload/'+resType+'/' + project.user_id + "/";
    }else{ //临时项目
      projectDetails = await pool.query('SELECT * FROM upload_resources_tmp WHERE id = ? AND user_id = ?', [projectId, req.user_id]);
      if (projectDetails.length === 0) {
        return res.json({ msg: 'tmp Project not found', code: -404 });
      }
      project = projectDetails[0];
      userDir = './upload_tmp/'+resType+'/' + project.user_id + "/";
    }
    const filePath = userDir + project.install_dir + '.zip';
    const imagePath = userDir + project.install_dir + '.png';
    //删除项目图片
    try {
      await fsPromises.unlink(imagePath);
      console.log(`File deleted successfully: ${imagePath}`);
    }catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    //删除脚本zip
    try {
      await fsPromises.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    // 删除数据库中的记录
    if (!temp) {
      await pool.query('DELETE FROM upload_resources WHERE id = ?', [projectId]);
      //删除点赞记录
      await pool.query('DELETE FROM user_like_records WHERE project_id = ? AND type = ?', [projectId,res_type]);
      //删除点赞消息记录
      await pool.query('DELETE FROM like_message WHERE project_id = ? AND project_type = ?', [projectId,res_type]);
      //删除收藏记录
      await pool.query('DELETE FROM project_favorite_records WHERE project_id = ? AND type = ?', [projectId,res_type]);
      
      //删除评论记录
      // 获取所有相关评论（包括子评论）
      const comments = await pool.query('SELECT * FROM comment WHERE project_id = ? AND project_type = ?', [projectId, res_type]);
      
      // 删除评论中的图片文件
      const deleteCommentImages = async (commentContent) => {
        if (!commentContent) return;
        
        // 匹配 u-img 格式的图片URL
        // 单个图片格式: u-img[http://domain.com/assets/user-comment-images/4/1753782266711.png]
        // 多个图片格式: u-img[url1,url2,url3] (用逗号分隔)
        const blockRegex = /u-img\[([^\]]+)\]/g;
        let blockMatch;
        
        while ((blockMatch = blockRegex.exec(commentContent)) !== null) {
          const urlsString = blockMatch[1];
          // 分割多个URL（用逗号分隔）
          const urls = urlsString.split(',').map(url => url.trim());
          
          // 处理每个URL
          for (const url of urls) {
            // 从URL中提取userId和filename
            const urlMatch = url.match(/\/assets\/user-comment-images\/(\d+)\/(\d+\.png)/);
            if (urlMatch) {
              const userId = urlMatch[1];
              const filename = urlMatch[2];
              const imagePath = `./comment/${userId}/${filename}`;
              
              try {
                if (fs.existsSync(imagePath)) {
                  await fs.promises.unlink(imagePath);
                  console.log(`Deleted comment image: ${imagePath}`);
                }
              } catch (error) {
                console.error(`Failed to delete comment image ${imagePath}:`, error);
              }
            }
          }
        }
      };
      
      // 删除所有评论的图片
      for (const comment of comments) {
        await deleteCommentImages(comment.content);
      }
      //删除评论消息记录
      await pool.query('DELETE FROM comment_message WHERE project_id = ? AND project_type = ?', [projectId,res_type]);
      
      // 删除评论的点赞记录
      await pool.query('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, res_type]);
      
      // 删除评论的举报记录
      await pool.query('DELETE FROM comment_reports WHERE comment_id IN (SELECT id FROM comment WHERE project_id = ? AND project_type = ?)', [projectId, res_type]);
      
      // 删除评论记录
      await pool.query('DELETE FROM comment WHERE project_id = ? AND project_type = ?', [projectId, res_type]);
    }else{
      await pool.query('DELETE FROM upload_resources_tmp WHERE id = ?', [projectId]);
    }


    res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}
//前端获取用户钱包数据
const getUserWalletData = async (req, res) => {
  // 1、获取用户id
  const { userId } = req.query;
  try {
    // 2、根据用户id查询用户钱包数据
    const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(amount) AS totalAmount FROM pay_order WHERE status = 1 AND user_id = ?`, [userId]);
    const total = Number(totalRows[0].total);
    const totalAmount = Number(totalRows[0].totalAmount / 100);
    const response = await pool.query(`SELECT * FROM pay_order WHERE status = 1 AND user_id = ?`, [userId]);
    let data = {}
    data.payAmount = totalAmount;
    data.orderCount = total;
    data.dataList = response;
    // 3、返回用户钱包数据
    return res.json({ msg: "success", data: data, code: 0 });
  }catch (error) {
    console.error("Error getUserWalletData:", error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//前端获取用户收益相关
const getUserIncomeData = async (req, res) => {
  // 1、获取用户id
  const { userId } = req.query;
  try {
    // 2、根据用户id查询用户钱包数据
    // const totalRows = await pool.query(`SELECT COUNT(*) AS total, SUM(amount) AS totalAmount FROM pay_order WHERE status = 1 AND user_id = ?`, [userId]);
    // const total = Number(totalRows[0].total);
    // const totalAmount = Number(totalRows[0].totalAmount / 100);
    //当天总计
    const total = await pool.query(`SELECT pay_time,amount FROM pay_order WHERE status = 1 AND user_id = ?`, [userId]);
    //当天退款
    const refund = await pool.query(`SELECT pay_time,amount FROM pay_order WHERE status = 1 AND refund_status != 0 AND user_id = ?`, [userId]);

  }catch (error) {
    console.error("Error getUserIncomeData:", error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
//前端判断项目目录是否存在
const checkProjectDir = async (req, res) => {
  //获取项目目录名
  const { dirName } = req.query;
  let data = {}
  try{
    const result = await pool.query(`SELECT user_id,install_dir FROM upload WHERE LOWER(install_dir) LIKE LOWER(?);`, [dirName]);
    if(result.length > 0){
      //正式表判断是否是自己的项目
      if(result[0].user_id == req.user_id){
        data = { msg: 'error', code: 2 }
      }else{
        data = { msg: 'error', code: 1 }
      }
    }else{
      const result2 = await pool.query(`SELECT user_id,install_dir FROM upload_tmp WHERE LOWER(install_dir) LIKE LOWER(?);`, [dirName]);
      if(result2.length > 0){
        //临时表判断是否是自己的项目
        if(result2[0].user_id == req.user_id){
          data = { msg: 'error', code: 2 }
        }else{
          data = { msg: 'error', code: 1 }
        }
      }else{
        data = { msg: 'success', code: 0 }
      }
    }
  }catch(error){
    console.error("Error checkProjectDir:", error);
    data = { msg: 'Database error', code: -500 }
  }
  return res.json(data);
}
//前端判断资源目录是否存在
const checkResDir = async (req, res) => {
  //获取项目目录名
  const { dirName } = req.query;
  let data = {}
  try{
    const result = await pool.query(`SELECT user_id,install_dir FROM upload_resources WHERE LOWER(install_dir) LIKE LOWER(?);`, [dirName]);
    if(result.length > 0){
      //正式表判断是否是自己的项目
      if(result[0].user_id == req.user_id){
        data = { msg: 'error', code: 2 }
      }else{
        data = { msg: 'error', code: 1 }
      }
    }else{
      const result2 = await pool.query(`SELECT user_id,install_dir FROM upload_resources_tmp WHERE LOWER(install_dir) LIKE LOWER(?);`, [dirName]);
      if(result2.length > 0){
        //临时表判断是否是自己的项目
        if(result2[0].user_id == req.user_id){
          data = { msg: 'error', code: 2 }
        }else{
          data = { msg: 'error', code: 1 }
        }
      }else{
        data = { msg: 'success', code: 0 }
      }
    }
  }catch(error){
    console.error("Error checkResDir:", error);
    data = { msg: 'Database error', code: -500 }
  }
  return res.json(data);
}
//前端分享链接校验
const checksharedlink = async (req, res) => {
  // const { fid } = req.query;
  try{
    // 设置响应头并发送文件内容
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(shareHtml);
    // return res.json({ msg: 'success',data, code: 0 });
  }catch(err){
    console.error("Error checksharedlink:", err);
      return;
  }
}
//市场软件列表
const marketList = async (req, res) => {
  try {
    const loadedCount = req.query.loadedCount ? parseInt(req.query.loadedCount) : 0;
    const searchKeyword = req.query.searchKeyword ? req.query.searchKeyword : '';
    const tokenStr = req.query.tk ? req.query.tk : '';
    const orderType = req.query.orderType ? Number(req.query.orderType) : 1;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    // const isadmin = await isAdmin(tokenStr);

    let sqlQuery = 'SELECT DISTINCT id, plugin_name, user_name, install_dir, platforms, description, version, author, like_count, download, project_zip_size, price_type, price_value, need_device, image_path, create_time FROM upload_tmp u ';
    let queryParams = [];
    let whereClause = '';

    //判断系统
    let systemName = detectOperatingSystem(req);
    console.log(systemName)
    if(systemName){
      whereClause += `platforms = '${systemName}' AND `;
    }
    // if (!isadmin) {
    //   whereClause += 'u.state = 1 AND ';
    // }

    if (searchKeyword) {
      whereClause += '(u.plugin_name LIKE ? OR u.description LIKE ?) AND ';
      queryParams.push(`%${searchKeyword}%`);
      queryParams.push(`%${searchKeyword}%`);
    }

    // 处理价格筛选
    if (filters.price && filters.price != "") {
      const priceType = Number(filters.price);
      whereClause += `u.price_type = ? AND `;
      queryParams.push(priceType);
    }

    // 处理硬件筛选
    if (filters.hardware && filters.hardware != "") {
      const deviceType = filters.hardware.toString();
      whereClause += `(u.need_device = ? OR u.need_device LIKE ? OR u.need_device LIKE ? OR u.need_device LIKE ?) AND `;
      queryParams.push(deviceType); // 完全匹配
      queryParams.push(`${deviceType},%`); // 开头匹配
      queryParams.push(`%,${deviceType},%`); // 中间匹配
      queryParams.push(`%,${deviceType}`); // 结尾匹配
    }

    // 处理其他类别的筛选
    if (Object.keys(filters).length > 0 && filters.price) {
      delete filters.price; // 移除已经处理过的price筛选
    }

    // 处理硬件筛选
    if (filters.hardware && filters.hardware != "") {
      delete filters.hardware; // 移除已经处理过的hardware筛选
    }

    Object.entries(filters).forEach(([filterKey, filterValues]) => {
      if (filterValues.length > 0) {
        const uniqueFilterValues = Array.from(new Set(filterValues));
        if (uniqueFilterValues.length > 0) {
          let filterCondition = uniqueFilterValues.map(value => {
            queryParams.push(filterKey);
            queryParams.push(value);
            return `EXISTS(SELECT 1 FROM upload_filter uf WHERE uf.upload_id = u.id AND uf.filter_key = ? AND uf.filter_value = ?)`;
          }).join(' OR ');
          whereClause += `(${filterCondition}) AND `;
        }
      }
    });

    if (whereClause !== '') {
      sqlQuery += 'WHERE ' + whereClause.slice(0, -5); // 去掉最后一个 'AND'
    }

    // 排序
    let orderStr = ' ORDER BY create_time DESC';
    if (orderType === 2) {
      orderStr = ' ORDER BY download DESC';
    } else if (orderType === 3) {
      orderStr = ' ORDER BY like_count DESC';
    }

    sqlQuery += orderStr + ' LIMIT ?, 16'; // 添加排序和分页限制
    queryParams.push(loadedCount);

    const marketData = await pool.query(sqlQuery, queryParams);

    const responseData = {
      marketData: marketData
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching market list:", error);
    res.status(500).json({ error: "Server error" });
  }
};
//市场软件列表(模型，插件，工作流)
const marketResList = async (req, res) => {
  try {
    const loadedCount = req.query.loadedCount ? parseInt(req.query.loadedCount) : 0;
    const searchKeyword = req.query.searchKeyword ? req.query.searchKeyword : '';
    const tokenStr = req.query.tk ? req.query.tk : '';
    const orderType = req.query.orderType ? Number(req.query.orderType) : 1;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const resType = req.query.resType ? req.query.resType : 1;

    // const isadmin = await isAdmin(tokenStr);

    let sqlQuery = 'SELECT DISTINCT id, res_name, user_name, install_dir, platforms, short_desc, version, author, like_count, download, res_zip_size, price_type, price_value,res_type, image_path, create_time,ext_option FROM upload_resources_tmp u ';
    let queryParams = [];
    let whereClause = '';

    // if (!isadmin) {
    //   whereClause += 'u.state = 1 AND ';
    // }

    //处理类型筛选
    if (resType && resType != "") {
      whereClause += `u.res_type = ? AND `;
      queryParams.push(resType);
    }

    if (searchKeyword) {
      whereClause += '(u.res_name LIKE ? OR u.short_desc LIKE ?) AND ';
      queryParams.push(`%${searchKeyword}%`);
      queryParams.push(`%${searchKeyword}%`);
    }

    // 处理系统筛选
    if (filters.system && filters.system != "") {
      const Platforms = String(filters.system);
      whereClause += `u.platforms = ? AND `;
      queryParams.push(Platforms);
    }
    
    // 处理价格筛选
    if (filters.price && filters.price != "") {
      const priceType = Number(filters.price);
      whereClause += `u.price_type = ? AND `;
      queryParams.push(priceType);
    }

    // 处理其他类别的筛选
    if (Object.keys(filters).length > 0 && filters.price) {
      delete filters.price; // 移除已经处理过的price筛选
    }
    if(filters.system){
      delete filters.system; // 移除已经处理过的system筛选
    }

    Object.entries(filters).forEach(([filterKey, filterValues]) => {
      if (filterValues.length > 0) {
        const uniqueFilterValues = Array.from(new Set(filterValues));
        if (uniqueFilterValues.length > 0) {
          let filterCondition = uniqueFilterValues.map(value => {
            queryParams.push(filterKey);
            queryParams.push(value);
            return `EXISTS(SELECT 1 FROM upload_resources_filter uf WHERE uf.upload_id = u.id AND uf.filter_key = ? AND uf.filter_value = ?)`;
          }).join(' OR ');
          whereClause += `(${filterCondition}) AND `;
        }
      }
    });

    if (whereClause !== '') {
      sqlQuery += 'WHERE ' + whereClause.slice(0, -5); // 去掉最后一个 'AND'
    }

    // 排序
    let orderStr = ' ORDER BY create_time DESC';
    if (orderType === 2) {
      orderStr = ' ORDER BY download DESC';
    } else if (orderType === 3) {
      orderStr = ' ORDER BY like_count DESC';
    }

    sqlQuery += orderStr + ' LIMIT ?, 16'; // 添加排序和分页限制
    queryParams.push(loadedCount);

    const marketData = await pool.query(sqlQuery, queryParams);


    const responseData = {
      marketData: marketData.map(item => {
        return {
          ...item,
          ext_option: JSON.parse(JSON.parse(item["ext_option"])["filterData"])
        };
      })
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching market list:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//前端审核获取AI项目详情
const marketAppInfo = async (req, res) => {
  try {
    const uploadId = req.query.fId ? parseInt(req.query.fId) : 0;

    // console.log(isadmin);

    // 构造 SQL 查询语句，使用 LIKE 来匹配相似的插件名称
    let sqlQuery = 'SELECT id,user_id, plugin_name, user_name, install_dir, platforms, description, version, author, like_count, download, project_zip_size, price_type, price_value, need_device, image_path, public_option, oss_path, pan_123_path, plugn_desc, cloud_storage_link, create_time FROM upload_tmp WHERE id = ?';

    // 执行查询
    const marketData = await pool.query(sqlQuery, [uploadId]);

    if(!marketData || marketData.length <= 0){
      return res.status(404).json({ error: "Canot find App!!" });
    }

    // 构造响应对象
    const responseData = marketData[0];

    if(req.user_role != 1){
      //非管理员如果是作者则可以查看
      if(req.user_id != responseData["user_id"]){
        return res.json({ msg: 'token not valid', code:-1 })
      }
    }

    if(responseData["public_option"]){
      //有提交参数的
      let optionObj = JSON.parse(responseData["public_option"]);

      let retOptionObj = {};
      retOptionObj["gupRadio"] = optionObj["gupRadio"];
      retOptionObj["projectUrl"] = optionObj["projectUrl"];
      retOptionObj["needGupRaw"] = optionObj["needGupRaw"];

      responseData["public_option"] = retOptionObj;
    }

    //判断是否购买，没购买去掉网盘相关信息
    let isPurchased = true;
    // try {
    //   const userInfo = await userInfoByToken(req.headers['access-token']);
    //   if(userInfo){
    //     isPurchased = await checkPurchaseStatus(2, Number(responseData["id"]), userInfo.user_id, userInfo.user_role);
    //   }
      
    // } catch (error) {
    //   console.error(error);
    // }

    if(!isPurchased){
      //没购买不给显示网盘地址
      if(responseData["cloud_storage_link"]){
        delete responseData["cloud_storage_link"];
      }
    }

    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error("Error marketAppInfo:", error);
    res.status(500).json({ error: "Server error" });
  }
}

//前端审核获取(模型，插件，工作流)详情
const marketResInfo = async (req, res) => {
  try {
    const uploadId = req.query.fId ? parseInt(req.query.fId) : 0;

    // console.log(isadmin);

    // 构造 SQL 查询语句，使用 LIKE 来匹配相似的插件名称
    let sqlQuery = 'SELECT id,user_id, res_name, user_name, install_dir, platforms, short_desc, version, author, like_count, download, res_zip_size, price_type, price_value, res_type,res_install, image_path, ext_option, oss_path, pan_123_path, res_desc, cloud_storage_link, create_time FROM upload_resources_tmp WHERE id = ?';

    // 执行查询
    const marketData = await pool.query(sqlQuery, [uploadId]);

    if(!marketData || marketData.length <= 0){
      return res.status(404).json({ error: "Canot find App!!" });
    }

    if(req.user_role != 1){
      //非管理员如果是作者则可以查看
      if(req.user_id != responseData["user_id"]){
        return res.json({ msg: 'token not valid', code:-1 })
      }
    }


    // 构造响应对象
    const responseData = marketData[0];

    if(responseData["ext_option"]){
      //有提交参数的
      let optionObj = JSON.parse(responseData["ext_option"]);

      let retOptionObj = {};
      retOptionObj["filterData"] = JSON.parse(optionObj["filterData"]);
      retOptionObj["projectUrl"] = optionObj["projectUrl"];

      responseData["ext_option"] = retOptionObj;
    }

    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error("Error marketAppInfo:", error);
    res.status(500).json({ error: "Server error" });
  }
}

//=====================上传临时表=======================
const getAIProjectListtmp = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', plugin_name, user_name, state,platforms } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key]) {
          conditions.push(`${pool.escapeId(key)} LIKE ?`);
          params.push(`%${queryParams[key]}%`);
        }
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({ plugin_name, user_name, state,platforms });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM upload_tmp ${whereClause}`, [...whereParams]);
    const total = Number(totalRows[0].total);

    // 分页查询
    const rows = await pool.query(
      `SELECT id, user_id, user_name, plugin_name, description, version, author, platforms, install_dir, like_count, download, project_zip_size, create_time, state ,price_type,price_value,image_path,public_option ,plugn_desc,cloud_storage_link,update_time,pan_123_path,need_device
       FROM upload_tmp
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
        size,
        current,
        records: data
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch upload list.', code: -500 });
  }
}

//模型，插件，工作流列表
const getResListtmp = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', res_name, user_name, state,res_type,platforms } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key]) {
          conditions.push(`${pool.escapeId(key)} LIKE ?`);
          params.push(`%${queryParams[key]}%`);
        }
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({ res_name, user_name, state,res_type,platforms });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM upload_resources_tmp ${whereClause}`, [...whereParams]);
    const total = Number(totalRows[0].total);

    // 分页查询
    const rows = await pool.query(
      `SELECT id, user_id, user_name, res_name, short_desc, version, author, platforms, install_dir, like_count, download, res_zip_size, create_time, state ,price_type,price_value,res_type,res_install,image_path,ext_option ,res_desc,cloud_storage_link,update_time,pan_123_path
       FROM upload_resources_tmp
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
        size,
        current,
        records: data
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch upload list.', code: -500 });
  }
}
//项目更新相关配置
const updateAIProjecttmp = async (req, res) => {
  const { id, description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, image_path, pan_123_path,device } = req.body

  try {
    if (image_path != null) {
      await pool.query('UPDATE upload_tmp SET description = ?,plugn_desc = ?,cloud_storage_link = ?,public_option = ?, price_type = ?, price_value = ?,image_path = ?, pan_123_path = ?, need_device = ? WHERE id = ?', [description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, image_path, pan_123_path, device, id])
    } else {
      // 更新数据库中项目的审核状态
      await pool.query('UPDATE upload_tmp SET description = ?,plugn_desc = ?,cloud_storage_link = ?,public_option = ?, price_type = ?, price_value = ?,pan_123_path = ?, need_device = ? WHERE id = ?', [description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, pan_123_path, device, id])
    }
    return res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error('Error updateAIProjecttmp:',error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}

//资源更新相关配置
const updateRestmp = async (req, res) => {
  const { id, description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, image_path, pan_123_path,resInstall } = req.body

  try {
    if (image_path != null) {
      await pool.query('UPDATE upload_resources_tmp SET short_desc = ?,res_desc = ?,cloud_storage_link = ?,ext_option = ?, price_type = ?, price_value = ?,image_path = ?, pan_123_path = ?,res_install = ? WHERE id = ?', [description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, image_path, pan_123_path,resInstall, id])
    } else {
      // 更新数据库中项目的审核状态
      await pool.query('UPDATE upload_resources_tmp SET  short_desc = ?,res_desc = ?,cloud_storage_link = ?,ext_option = ?, price_type = ?, price_value = ?,pan_123_path = ?,res_install = ? WHERE id = ?', [description, plugn_desc, cloud_storage_link, public_option, price_type, price_value, pan_123_path,resInstall, id])
    }
    return res.json({ msg: 'sucess', code: 0 });
  } catch (error) {
    console.error('Error updateRestmp:',error);
    return res.json({ msg: 'Database error', code: -500 });
  }
}
const delAIProjectmp = async (req, res) => {
  const { id } = req.query;
  const projectId = id; // 假设前端通过URL参数传递ID

  try {
    // 查询数据库以获取项目详情，包括安装目录和用户ID
    const projectDetails = await pool.query('SELECT * FROM upload_tmp WHERE id = ?', [projectId]);
    if (projectDetails.length === 0) {
      return res.json({ msg: 'Project not found', code: -404 });
    }

    const project = projectDetails[0];
    const userDir = './upload_tmp/' + project.user_id + "/";
    const filePath = userDir + project.install_dir + '.zip';
    const imgPath = './upload_tmp/'+project.image_path

    //删除脚本zip
    try {
      await fsPromises.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
    //删除图片
    try {
      await fsPromises.unlink(imgPath);
      console.log(`File deleted successfully: ${imgPath}`);
    }catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    // 删除数据库中的记录
    await pool.query('DELETE FROM upload_tmp WHERE id = ?', [projectId]);

    res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}

//删除资源
const delRestmp = async (req, res) => {
  const { id } = req.query;
  const projectId = id; // 假设前端通过URL参数传递ID

  try {
    // 查询数据库以获取项目详情，包括安装目录和用户ID
    const projectDetails = await pool.query('SELECT * FROM upload_resources_tmp WHERE id = ?', [projectId]);
    if (projectDetails.length === 0) {
      return res.json({ msg: 'Project not found', code: -404 });
    }

    const project = projectDetails[0];
    let resType = 'model'
    switch (project.res_type) {
      case '1':
        resType = 'model';
        break;
      case '2':
        resType = 'plugin';
        break;
      case '3':
        resType = 'workflow';
        break;
    }
    const userDir = './upload_tmp/'+resType + '/' + project.user_id + "/";
    const filePath = userDir + project.install_dir + '.zip';
    const imgPath = './upload_tmp/'+project.image_path

    //删除脚本zip
    try {
      await fsPromises.unlink(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
    //删除图片
    try {
      await fsPromises.unlink(imgPath);
      console.log(`File deleted successfully: ${imgPath}`);
    }catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }

    // 删除数据库中的记录
    await pool.query('DELETE FROM upload_resources_tmp WHERE id = ?', [projectId]);

    res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}

const setProjectReviewStatustmp = async (req, res) => {
  const { id, state } = req.query;

  // 验证state值
  if (state !== '0' && state !== '1') {
    return res.json({ msg: 'Invalid state value. State must be 0 or 1.', code: -400 });
  }

  try {
    // 更新数据库中项目的审核状态
    const result = await pool.query('UPDATE upload_tmp SET state = ? WHERE id = ?', [state, id]);

    if (result.affectedRows === 0) {
      return res.json({ msg: 'Project not found or no rows affected', code: -404 });
    }

    // 查询数据库以获取项目详情用于移动文件
    const projectDetails = await pool.query('SELECT * FROM upload_tmp WHERE id = ?', [id]);
    if (projectDetails.length === 0) {
      return res.json({ msg: 'Project not found', code: -404 });
    }

    const project = projectDetails[0];

    //先处理资源
    const tmpUserDir = './upload_tmp/' + project.user_id + "/";
    const tmpFilePath = tmpUserDir + project.install_dir + '.zip';
    const tmpImgPath = tmpUserDir + project.install_dir + '.png';

    //复制到的目录
    const targetUserDir = './upload/' + project.user_id + "/";
    const targetFilePath = targetUserDir + project.install_dir + '.zip';
    const targetImgPath = targetUserDir + project.install_dir + '.png';

    //创建用户目录
    if (!fs.existsSync(targetUserDir)) {
      try {
        await fsPromises.mkdir(targetUserDir, { recursive: true });
      } catch (error) {
        console.error("Failed to create user directory:", error);
        res.status(400).json({
          error: 'Failed to create user directory'
        });
        return;
      }
    }

    //移动脚本zip
    try {
      await fsPromises.copyFile(tmpFilePath, targetFilePath);
      console.log(`File moved successfully: ${tmpFilePath} -> ${targetFilePath}`);
    }catch(e){
      console.log(`File moved error: ${tmpFilePath} -> ${targetFilePath}`);
      res.status(400).json({
        error: 'zip moved error'
      });
      return;
    }

    //移动图片
    try {
      await fsPromises.copyFile(tmpImgPath, targetImgPath);
      
      console.log(`File moved successfully: ${tmpImgPath} -> ${targetImgPath}`);
    }catch(e){
      console.log(`File moved error: ${tmpImgPath} -> ${targetImgPath}`);
      res.status(400).json({
        error: 'image moved error'
      });
      return;
    }

    try {
      await fsPromises.unlink(tmpFilePath);
      await fsPromises.unlink(tmpImgPath);
    }catch(e){
      console.log(`unlink tmp file error`);
      res.status(400).json({
        error: 'unlink tmp file error'
      });
      return;
    }

    //后处理数据库
    let selecttime;
    const selectupload = await pool.query('SELECT id,create_time FROM upload WHERE user_id = ? AND install_dir = ?',[project.user_id,project.install_dir]);
    if(selectupload.length > 0){
      selecttime = formatDateTimeSync(selectupload[0].create_time)
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE 语句同步数据
      const result2 = await pool.query(`
        INSERT INTO upload (id,user_id, user_name, plugin_name, description, version, author, platforms, install_dir, project_zip_size, create_time, state, price_type, price_value, image_path, public_option, plugn_desc, cloud_storage_link, update_time,need_device)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        user_name = VALUES(user_name),
        plugin_name = VALUES(plugin_name),
        description = VALUES(description),
        version = VALUES(version),
        author = VALUES(author),
        platforms = VALUES(platforms),
        install_dir = VALUES(install_dir),
        project_zip_size = VALUES(project_zip_size),
        create_time = VALUES(create_time),
        state = VALUES(state),
        price_type = VALUES(price_type),
        price_value = VALUES(price_value),
        image_path = VALUES(image_path),
        public_option = VALUES(public_option),
        plugn_desc = VALUES(plugn_desc),
        cloud_storage_link = VALUES(cloud_storage_link),
        update_time = VALUES(update_time),
        need_device = VALUES(need_device)

      `, [
        selectupload[0].id,
        project.user_id,
        project.user_name,
        project.plugin_name,
        project.description,
        project.version,
        project.author,
        project.platforms,
        project.install_dir,
        project.project_zip_size,
        selecttime,
        project.state,
        project.price_type,
        project.price_value,
        project.image_path,
        project.public_option,
        project.plugn_desc,
        project.cloud_storage_link,
        project.create_time,
        project.need_device
      ]);
      
      if (result2.affectedRows === 0) {
        return res.json({ msg: 'Project not found or no rows affected', code: -404 });
      }
    }else{
      selecttime = formatDateTimeSync(project.create_time)
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE 语句同步数据
      const result2 = await pool.query(`
        INSERT INTO upload (user_id, user_name, plugin_name, description, version, author, platforms, install_dir, like_count, download, project_zip_size, create_time, state, price_type, price_value, image_path, public_option, plugn_desc, cloud_storage_link, update_time, pan_123_path,need_device)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        ON DUPLICATE KEY UPDATE
        user_name = VALUES(user_name),
        plugin_name = VALUES(plugin_name),
        description = VALUES(description),
        version = VALUES(version),
        author = VALUES(author),
        platforms = VALUES(platforms),
        install_dir = VALUES(install_dir),
        like_count = VALUES(like_count),
        download = VALUES(download),
        project_zip_size = VALUES(project_zip_size),
        create_time = VALUES(create_time),
        state = VALUES(state),
        price_type = VALUES(price_type),
        price_value = VALUES(price_value),
        image_path = VALUES(image_path),
        public_option = VALUES(public_option),
        plugn_desc = VALUES(plugn_desc),
        cloud_storage_link = VALUES(cloud_storage_link),
        update_time = VALUES(update_time),
        pan_123_path = VALUES(pan_123_path),
        need_device = VALUES(need_device)
      `, [
        project.user_id,
        project.user_name,
        project.plugin_name,
        project.description,
        project.version,
        project.author,
        project.platforms,
        project.install_dir,
        0,
        0,
        project.project_zip_size,
        selecttime,
        project.state,
        project.price_type,
        project.price_value,
        project.image_path,
        project.public_option,
        project.plugn_desc,
        project.cloud_storage_link,
        project.create_time,
        project.pan_123_path,
        project.need_device
      ]);
      
      if (result2.affectedRows === 0) {
        return res.json({ msg: 'Project not found or no rows affected', code: -404 });
      }
    }

    // 删除临时表中的数据
    await pool.query('DELETE FROM upload_tmp WHERE id = ?', [id]);

    //获取项目id
    const selectupload2 = await pool.query('SELECT id,create_time FROM upload WHERE user_id = ? AND install_dir = ?',[project.user_id,project.install_dir]);
    let selectupl = selectupload2[0].id

    const filterdata = JSON.parse(project.public_option).filterData
    for (const item of Object.keys(filterdata)) {
      try {
        //删除旧记录
        const deleteResult = await pool.query('DELETE FROM upload_filter WHERE upload_id = ? AND filter_key = ?', [selectupl, item]);
        // 检查是否有记录被删除
        if (deleteResult.affectedRows === 0) {
          // 根据业务需求决定如何处理
          console.warn('No records were deleted.');
          // 可以选择返回提示信息或者继续执行插入操作
        }
    
        // 如果更新没有影响行，则插入新记录
        //filter_data 如果多数据，则拆分插入
        const filter_data_array = filterdata[item]
        if(Array.isArray(filter_data_array)) {
          for(let i in filterdata[item]){
            const filter_data_item = filter_data_array[i]
            const insertResult = await pool.query(
              'INSERT INTO upload_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
              [selectupl, item, filter_data_item]
            );
            if (insertResult.affectedRows === 0) {
              return { msg: `Insert failed ${filter_data_item}`, code: 100 }
            }
          }
        }else{
          const insertResult = await pool.query(
            'INSERT INTO upload_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
            [selectupl, item, filterdata[item]]
          );
          if (insertResult.affectedRows === 0) {
            return { msg: 'Insert failed', code: 100 }
          }
        }

      } catch (error) {
        console.log("update error", error)
      }
    }

    res.json({ msg: 'sucess',data:selectupl, code: 0 });
  } catch (error) {
    console.log("Database error:", error);
    res.json({ msg: 'Database error', code: -500 });
  }
}

//设置资源审核状态
const setResReviewStatustmp = async (req, res) => {
  const { id, state } = req.query;

  // 验证state值
  if (state !== '0' && state !== '1') {
    return res.json({ msg: 'Invalid state value. State must be 0 or 1.', code: -400 });
  }

  try {
    // 更新数据库中项目的审核状态
    const result = await pool.query('UPDATE upload_resources_tmp SET state = ? WHERE id = ?', [state, id]);

    if (result.affectedRows === 0) {
      return res.json({ msg: 'Resources not found or no rows affected', code: -404 });
    }

    // 查询数据库以获取项目详情用于移动文件
    const projectDetails = await pool.query('SELECT * FROM upload_resources_tmp WHERE id = ?', [id]);
    if (projectDetails.length === 0) {
      return res.json({ msg: 'Resources not found', code: -404 });
    }

    const project = projectDetails[0];
    let resType = 'model'
    switch (project.res_type) {
      case 1:
        resType = 'model';
        break;
      case 2:
        resType = 'plugin';
        break;
      case 3:
        resType = 'workflow';
        break;
    }

    //先处理资源
    const tmpUserDir = './upload_tmp/'+resType+'/' + project.user_id + "/";
    const tmpFilePath = tmpUserDir + project.install_dir + '.zip';
    const tmpImgPath = tmpUserDir + project.install_dir + '.png';

    //复制到的目录
    const targetUserDir = './upload/'+resType+'/' + project.user_id + "/";
    const targetFilePath = targetUserDir + project.install_dir + '.zip';
    const targetImgPath = targetUserDir + project.install_dir + '.png';

    //创建用户目录
    if (!fs.existsSync(targetUserDir)) {
      try {
        await fsPromises.mkdir(targetUserDir, { recursive: true });
      } catch (error) {
        console.error("Failed to create user directory:", error);
        res.status(400).json({
          error: 'Failed to create user directory'
        });
        return;
      }
    }

    //移动脚本zip
    try {
      await fsPromises.copyFile(tmpFilePath, targetFilePath);
      console.log(`File moved successfully: ${tmpFilePath} -> ${targetFilePath}`);
    }catch(e){
      console.log(`File moved error: ${tmpFilePath} -> ${targetFilePath}`);
      res.status(400).json({
        error: 'zip moved error'
      });
      return;
    }

    //移动图片
    try {
      await fsPromises.copyFile(tmpImgPath, targetImgPath);
      
      console.log(`File moved successfully: ${tmpImgPath} -> ${targetImgPath}`);
    }catch(e){
      console.log(`File moved error: ${tmpImgPath} -> ${targetImgPath}`);
      res.status(400).json({
        error: 'image moved error'
      });
      return;
    }

    try {
      await fsPromises.unlink(tmpFilePath);
      await fsPromises.unlink(tmpImgPath);
    }catch(e){
      console.log(`unlink tmp file error`);
      res.status(400).json({
        error: 'unlink tmp file error'
      });
      return;
    }

    //后处理数据库
    let selecttime;
    const selectupload = await pool.query('SELECT id,create_time FROM upload_resources WHERE user_id = ? AND install_dir = ?',[project.user_id,project.install_dir]);
    if(selectupload.length > 0){
      selecttime = formatDateTimeSync(selectupload[0].create_time)
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE 语句同步数据
      const result2 = await pool.query(`
        INSERT INTO upload_resources (
          id,user_id, user_name, res_name, short_desc, version, author, platforms, install_dir,
          res_zip_size, price_type,price_value,res_type,res_install,
          image_path,oss_path,res_desc,ext_option,cloud_storage_link,create_time,
          update_time,state
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        user_name = VALUES(user_name),
        res_name = VALUES(res_name),
        short_desc = VALUES(short_desc),
        version = VALUES(version),
        author = VALUES(author),
        platforms = VALUES(platforms),
        install_dir = VALUES(install_dir),
        res_zip_size = VALUES(res_zip_size),
        price_type = VALUES(price_type),
        price_value = VALUES(price_value),
        res_type = VALUES(res_type),
        res_install = VALUES(res_install),
        image_path = VALUES(image_path),
        oss_path = VALUES(oss_path),
        res_desc = VALUES(res_desc),
        ext_option = VALUES(ext_option),
        cloud_storage_link = VALUES(cloud_storage_link),
        create_time = VALUES(create_time),
        update_time = VALUES(update_time),
        state = VALUES(state)
      `, [
        selectupload[0].id,
        project.user_id,
        project.user_name,
        project.res_name,
        project.short_desc,
        project.version,
        project.author,
        project.platforms,
        project.install_dir,
        project.res_zip_size,
        project.price_type,
        project.price_value,
        project.res_type,
        project.res_install,
        project.image_path,
        project.oss_path,
        project.res_desc,
        project.ext_option,
        project.cloud_storage_link,
        selecttime,
        project.create_time,
        project.state,
      ]);
      
      if (result2.affectedRows === 0) {
        return res.json({ msg: 'Resources not found or no rows affected', code: -404 });
      }
    }else{
      selecttime = formatDateTimeSync(project.create_time)
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE 语句同步数据
      const result2 = await pool.query(`
        INSERT INTO upload_resources (
          user_id, user_name, res_name, short_desc, version, author, platforms, install_dir,
          like_count, download, res_zip_size, price_type,price_value,res_type,res_install,
          image_path,oss_path,pan_123_path,res_desc,ext_option,cloud_storage_link,create_time,
          update_time,state
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        user_name = VALUES(user_name),
        res_name = VALUES(res_name),
        short_desc = VALUES(short_desc),
        version = VALUES(version),
        author = VALUES(author),
        platforms = VALUES(platforms),
        install_dir = VALUES(install_dir),
        like_count = VALUES(like_count),
        download = VALUES(download),
        res_zip_size = VALUES(res_zip_size),
        price_type = VALUES(price_type),
        price_value = VALUES(price_value),
        res_type = VALUES(res_type),
        res_install = VALUES(res_install),
        image_path = VALUES(image_path),
        oss_path = VALUES(oss_path),
        pan_123_path = VALUES(pan_123_path),
        res_desc = VALUES(res_desc),
        ext_option = VALUES(ext_option),
        cloud_storage_link = VALUES(cloud_storage_link),
        create_time = VALUES(create_time),
        update_time = VALUES(update_time),
        state = VALUES(state)
      `, [
        project.user_id,
        project.user_name,
        project.res_name,
        project.short_desc,
        project.version,
        project.author,
        project.platforms,
        project.install_dir,
        0,
        0,
        project.res_zip_size,
        project.price_type,
        project.price_value,
        project.res_type,
        project.res_install,
        project.image_path,
        project.oss_path,
        project.pan_123_path,
        project.res_desc,
        project.ext_option,
        project.cloud_storage_link,
        selecttime,
        project.create_time,
        project.state,
      ]);
      
      if (result2.affectedRows === 0) {
        return res.json({ msg: 'Resources not found or no rows affected', code: -404 });
      }
    }

    // 删除临时表中的数据
    await pool.query('DELETE FROM upload_resources_tmp WHERE id = ?', [id]);

    //获取项目id
    const selectupload2 = await pool.query('SELECT id,create_time FROM upload_resources WHERE user_id = ? AND install_dir = ?',[project.user_id,project.install_dir]);
    let selectupl = selectupload2[0].id

    const filterdata = JSON.parse(JSON.parse(project.ext_option).filterData)
    for (const item of Object.keys(filterdata)) {
      try {
        //删除旧记录
        const deleteResult = await pool.query('DELETE FROM upload_resources_filter WHERE upload_id = ? AND filter_key = ?', [selectupl, item]);
        // 检查是否有记录被删除
        if (deleteResult.affectedRows === 0) {
          // 根据业务需求决定如何处理
          console.warn('No records were deleted.');
          // 可以选择返回提示信息或者继续执行插入操作
        }
    
        // 如果更新没有影响行，则插入新记录
        //filter_data 如果多数据，则拆分插入
        const filter_data_array = filterdata[item]
        if(Array.isArray(filter_data_array)){
          for(let i in filterdata[item]){
            const filter_data_item = filter_data_array[i]
            const insertResult = await pool.query(
              'INSERT INTO upload_resources_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
              [selectupl, item, filter_data_item]
            );
            if (insertResult.affectedRows === 0) {
              return { msg: `Insert failed ${filter_data_item}`, code: 100 }
            }
          }
        }else{
          const insertResult = await pool.query(
            'INSERT INTO upload_resources_filter (upload_id, filter_key, filter_value) VALUES (?, ?, ?)',
            [selectupl, item, filterdata[item]]
          );
          if (insertResult.affectedRows === 0) {
            return { msg: 'Insert failed', code: 100 }
          }
        }
        

      } catch (error) {
        console.log("update error", error)
        return { msg: 'update error', code: 100 }
      }
    }

    res.json({ msg: 'sucess',data:selectupl, code: 0 });
  } catch (error) {
    console.log("Database error:", error);
    res.json({ msg: 'Database error',error, code: -500 });
  }
}


//上传图片
const uploadImagetmp = async (req, res) => {
  try {
    // console.log(req)
    const { userid, oldimageurl,installDir } = req.body
    const file = req.files
    // const fileName = file.image.name
    let userDir = './upload_tmp/' + userid + "/";
    //创建用户目录
    if (!fs.existsSync(userDir)) {
      try {
        await mkdir(userDir, { recursive: true }); // 使用 recursive 选项确保创建整个目录路径
      } catch (error) {
        console.error("Failed to create user directory:", error);
        res.status(400).json({
          error: 'Failed to create user directory'
        });
        return;
      }
    }
  
    //上传图片到某个位置
    let imagePath = userDir + installDir+ '.png';
    let imageObj = req.files.image;
    imageObj.mv(imagePath, async (err) => {
      if(err){
        console.error("Update load image error:" + imagePath);
      }
    });
    const fileUrl = userid + '/'  + installDir +'.png'
    // console.log(filePath)

    return res.json({ msg: 'succus', data: fileUrl, code: 0 });
  } catch (error) {
    console.error("Upload Image Error:" + error);
    return res.json({ msg: 'Upload Image Error', code: -500 });
  }
}

//上传图片
const uploadImageRestmp = async (req, res) => {
  try {
    // console.log(req)
    const { userid, resType,installDir } = req.body
    const file = req.files
    // const fileName = file.image.name
    let userDir = './upload_tmp/'+resType +'/' + userid + "/";
    //创建用户目录
    if (!fs.existsSync(userDir)) {
      try {
        await mkdir(userDir, { recursive: true }); // 使用 recursive 选项确保创建整个目录路径
      } catch (error) {
        console.error("Failed to create user directory:", error);
        res.status(400).json({
          error: 'Failed to create user directory',
          data:userDir
        });
        return;
      }
    }
  
    //上传图片到某个位置
    let imagePath = userDir + installDir+ '.png';
    let imageObj = req.files.image;
    imageObj.mv(imagePath, async (err) => {
      if(err){
        console.error("Update load image error:" + imagePath);
      }
    });
    const fileUrl = resType+ '/' + userid + '/'  + installDir +'.png'
    // console.log(filePath)

    return res.json({ msg: 'succus', data: fileUrl, code: 0 });
  } catch (error) {
    console.error("Upload Image Error:" + error);
    return res.json({ msg: 'Upload Image Error', code: -500 });
  }
}

//后端分享界面信息获取
const getShareCfg = async (req, res) => {
  let result = {};
  result.shareInfo = getShareInfoConfig;
  try {
    // 获取分享界面相关信息
    let share = await readConfig("share_cfg");
    if (!share) {
      share.shareInfo = getShareInfoConfig;
    }
    result.shareInfo = share.shareInfo;
    return res.json({ msg: 'success', data: result, code: 0 });
  }catch (error) {
    console.error("getShareCfg Error:" + error);
    return res.json({ msg: 'not data',data:result, code: 0 });
  }
}
//后端分享界面信息修改
const updateShareCfg = async (req, res) => {
  const { shareInfo } = req.body
  await writeConfig("share_cfg", { shareInfo });
  return res.json({ msg: "success", code: 0 })
}

//后端获取共创者信息
const getCollaboratorlist = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', name, software_name, state } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key]) {
          conditions.push(`${pool.escapeId(key)} LIKE ?`);
          params.push(`%${queryParams[key]}%`);
        }
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        whereParams: params
      };
    }

    // 使用示例
    const { whereClause, whereParams } = buildWhereClause({ name, software_name, state });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM collaborator ${whereClause}`, [...whereParams]);
    const total = Number(totalRows[0].total);

    // 分页查询
    const rows = await pool.query(
      `SELECT id, company_name,machine_id, software_name, domain_name, name, email, phone,protocol,public_key, coll_type, create_time, expiry_time, state,server_status, ban_reason, ban_end_time,
        CASE 
          WHEN expiry_time < NOW() THEN 1
          ELSE 0
        END as is_expired
       FROM collaborator
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      create_time: formatDateTimeSync(row.create_time),
      expiry_time: formatDateTimeSync(row.expiry_time)
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch collab list.', code: -500 });
  }
}
//后端编辑共创者信息
const editCollab = async (req, res) => {
  try {
    const { id, company_name,machine_id, software_name, domain_name, name, email, phone,protocol, coll_type, expiry_time, state, ban_reason, ban_end_time,server_status } = req.body;

    // 构建更新语句
    const updateQuery = `
      UPDATE collaborator
      SET company_name = ?,machine_id = ?, software_name = ?, domain_name = ?, name = ?, email = ?, phone = ?,protocol=?, coll_type = ?, expiry_time = ?, state = ?, ban_reason = ?, ban_end_time = ?,server_status = ?
      WHERE id = ?`;

    // 执行更新操作
    const result = await pool.query(updateQuery, [
      company_name,machine_id, software_name, domain_name, name, email, phone,protocol, coll_type, expiry_time, state, ban_reason, ban_end_time,server_status, id
    ]);

    // 检查更新是否成功
    if (result.affectedRows === 0) {
      return res.json({ msg: 'Failed to update collaborator.', code: -2 });
    }

    res.json({ msg: 'Collaborator updated successfully.', code: 0 });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to update collaborator.', code: -3 });
  }
}
//后端添加共创者信息
const addCollab = async (req, res) => {
  try {
    const { company_name,machine_id, software_name, domain_name, name, email, phone,protocol, coll_type, expiry_time, state, ban_reason, ban_end_time,server_status } = req.body;
    //判断是否已经存在相同的邮箱信息
    const checkCollabEmailQuery = 'SELECT * FROM collaborator WHERE email = ?';
    const CollabemailResult = await pool.query(checkCollabEmailQuery, [email]);
    if (CollabemailResult.length > 0) {
      return res.json({ msg: '该邮箱已存在', code: -2 });
    }
    // 获取当前时间
    const create_time = new Date().toISOString().slice(0, 19).replace('T', ' '); // 格式化日期 为 'YYYY-MM-DD HH:MM:SS'
    //使用时间戳加随机数生成随机唯一密码
    const randompassword = btoa(new Date().getTime() + Math.floor(Math.random() * 1000000));
    const passwordEncrypt = await getPasswordEncrypt(randompassword);
    // 构建插入用户数据
    const user = {
      username:software_name,
      email,
      country:"",
      phone,
      password: passwordEncrypt,
      id_role:2,
    }
    // 先检查邮箱是否已经存在
    const checkEmailQuery = 'SELECT id FROM users WHERE email = ?';
    let emailResult = await pool.query(checkEmailQuery, [email]);
    if (emailResult.length == 0) { // 邮箱不存在，插入新用户
      const insertResult = await pool.query('INSERT INTO users set ?', [user]);
      const userId = insertResult.insertId;
      // 插入users_info表
      await pool.query('INSERT INTO users_info set ?', [{ user_id: userId }]);
      //创建后再查询用户id
      emailResult = await pool.query(checkEmailQuery, [email]);
      //再次判断用户是否存在
      if (emailResult.length == 0) {
        return res.json({ msg: 'Failed to add collaborator.', code: -2 });
      }
    }
    //创建私钥和公钥
    const keyManager = new KeyManager();
    keyManager.generate(); // 生成密钥对
    const publicKey = keyManager.getPublicKey();
    const privateKey = keyManager.getPrivateKey();

    // 构建插入语句
    const insertQuery = `INSERT INTO collaborator (id,company_name,machine_id, software_name, domain_name, name, email, phone,protocol,private_key,public_key, coll_type,create_time, expiry_time, state, ban_reason, ban_end_time,server_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)`;
    

    // 执行插入操作
    const result = await pool.query(insertQuery, [
      emailResult[0].id,
      company_name,machine_id, software_name, domain_name, name, email, phone,protocol,privateKey,publicKey, coll_type,create_time, expiry_time, state, ban_reason, ban_end_time,server_status
    ]);

    // 检查插入是否成功
    if (result.affectedRows === 0) {
      return res.json({ msg: 'Failed to add collaborator.', code: -2 });
    }

    res.json({ msg: 'Collaborator added successfully.', code: 0 });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to add collaborator.', code: -3 });
  }
}
//后端删除共创者信息
const delCollab = async (req, res) => {
  try {
    const { id } = req.body;
    // 验证 id
    if (!id) {
      return res.json({ msg: 'Invalid id', code: -400 });
    }

    // 查询数据库
    const result = await pool.query('DELETE FROM collaborator WHERE id = ?', [id]);

    // 检查删除是否成功
    if (result.affectedRows === 0) {
      return res.json({ msg: 'Failed to delete collaborator.', code: -2 });
    }

    res.json({ msg: 'Collaborator deleted successfully.', code: 0 });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to delete collaborator.', code: -3 });
  }
}
//共创者获取状态
const getCollaboratorStatus = async (req, res) => {
  try {
    let result = await getLicenseFileInfo()
    if(!result){
      return res.json({ msg: 'Unauthorized.', code: -500 });
    }
    let CoConfig
    try{
      CoConfig = await readConfig("co_create_config_info");
      if (!CoConfig) {
        CoConfig = getCoConfig
      }
    }catch(e){
      CoConfig = getCoConfig
    }
    const result2 = result['data']
    const isexpiry = CoConfig.server_status>0?true:new Date(result2['expiry_time'].replace(/-/g, '/')) < new Date();
    // 准备响应数据
    const data = {
      ...result2,
      server_status:CoConfig.server_status, // 服务器状态 0:正常 1:过期 2:异常 3:封禁
      state: CoConfig.server_status==3? 1:0,
      coll_type: Number(result2['coll_type']),
      ban_reason: CoConfig.ban_reason,
      expiry_time: result2['expiry_time'],
      isexpiry: isexpiry,
      ban_end_time: CoConfig.ban_end_time,
      server_time: new Date().getTime(),
      isServer:config.IS_PARENT, //判断是否为主公司
    };
    if(config.IS_PARENT){
      data.server_status = 0
      data.state = 0
      data.isexpiry = false
    }
    // 返回过期时间
    res.json({ msg: 'success', data: data, code: 0 });
  }catch (error) {
      console.error(error);
      res.json({ msg: 'Unauthorized.', code: -500 });
  }
}
// 远程修改服务器状态接口（原始公司用）
const updateServerStatus = async (req, res) => {
  try {
    const {data,signature} = req.body;
    let datas = {data:data,signature:signature}
    const {verifyLicenseData} = require('../../helpers/license')
    const isValid = await verifyLicenseData(datas);
    if (isValid) {
      console.log('license 数据有效'); 
      await writeConfig("co_create_config_info",datas.data)
      res.json({ msg: 'success', code: 0 });
    }else{
      console.log('license 数据无效');
      return res.json({ msg: '404 not found', code: -4004 });
    }
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to update server status.', code: -3 });
  }
}
// 远程获取license文件接口（原始公司用）
const getLicenseFile = async (req, res) => {
  try {
    const {getLicenseFileInfo} = require('../../helpers/license')
    let result = await getLicenseFileInfo()
    return res.json({ msg: 'success', data: result, code: 0 });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to get license file.', code: -3 });
  }
}
// 远程更新license文件接口（原始公司用）
const updateLicenseFile = async (req, res) => {
  try {
    const {data,signature} = req.body;
    const {verifyLicenseData,updateLicenseFileInfo} = require('../../helpers/license')
    let datas = {data:data,signature:signature}
    console.log(datas)
    const isValid = await verifyLicenseData(datas);
    if (isValid) {
      let result = await updateLicenseFileInfo(datas)
      if(result){
        return res.json({ msg: 'success', code: 0 });
      }else{
        return res.json({ msg: 'Failed to update license file.', code: -3 });
      }
    }else{
      console.log('license 数据无效');
      return res.json({ msg: '404 not found', code: -4004 });
    }
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to update license file.', code: -3 });
  }
}
//修改共创者相关信息接口（共创者用）
const collaboratorsetting = async (req, res) => {
  try {
    const {data,signature,server_domain} = req.body;
    //查询对应共创者公钥
    const publicResult = await pool.query(`SELECT * FROM collaborator WHERE domain_name = ?`, [server_domain]);
    if (publicResult.length == 0) {
      return res.json({ msg: 'Failed to get collaborator.', code: -2 });
    }
    const publicKey = publicResult[0].public_key;
    const {verifyLicenseData} = require('../../helpers/license');
    let datas = {data:data,signature:signature}
    const isValid = await verifyLicenseData(datas,publicKey);
    if (isValid) {
      //修改数据库信息
      //根据server_domain 修改数据库 data中的值
      const result = await pool.query('UPDATE collaborator SET ? WHERE domain_name = ?', [data, server_domain]);
      if (result.affectedRows === 0) {
        return res.json({ msg: 'Failed to update collaborator.', code: -2 });
      }
      res.json({ msg: 'Collaborator updated successfully.', code: 0 });
    }else{
      console.log('license 数据无效');
      return res.json({ msg: '404 not found', code: -4004 });
    }
 }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to update collaborator.', code: -3 });
  }
}
//获取共创者加密文件信息
const getCollabLicense = async (req, res) => {
  const { domain_name,protocol,public_key } = req.body;
  try {
    let requst;
    //判断是否有协议
    if(!protocol){
      console.log('没有协议');
      return res.json({ msg: '协议错误，切换协议后重试', code: -3 });
    }else{
      try{
        requst = await axios.post(protocol+domain_name+'/users/getLicenseFile')
      }catch(e){
        console.error(e);
        return res.json({ msg: '协议错误，切换协议后重试', code: -3 });
      }
    }
    if(requst.data.code === 0){
      const {verifyLicenseData} = require('../../helpers/license')
      const isValid = await verifyLicenseData(requst.data.data,public_key);
      if (isValid) {
        return res.json({ msg: 'success', code: 0 });
      }else{
        return res.json({ msg: '文件异常', code: 0 });
      }
    }
    return res.json({ msg: 'Failed to get collaborator license.', code: -3 });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to get collaborator license.', code: -3 });
  }
}
//更新共创者加密文件信息
const updateCollabLicense = async (req, res) => { 
  const { params,license } = req.body;
  try {
    //根据id查询数据库中私钥信息
    const privateKey = await pool.query('SELECT private_key FROM collaborator WHERE id =?', [params.id]);
    if (privateKey.length === 0) {
      return res.json({ msg: '私钥不存在', code: -2 });
    }
    const {createLicenseData} = require('../../helpers/license')
    const result = await createLicenseData(license, privateKey[0].private_key);
    let requst;
    //判断是否有协议
    if(!params.protocol){
      console.log('没有协议');
      return res.json({ msg: '协议错误，切换协议后重试', code: -3 });
    }else{
      try{
        requst = await axios.post(params.protocol+params.domain_name+'/users/updateLicenseFile',result)
      }catch(e){
        console.error(e);
        return res.json({ msg: '协议错误，切换协议后重试', code: -3 });
      }
    }
    if(requst.data.code === 0){
      return res.json({ msg: 'success', code: 0 });
    }
    return res.json({ msg: 'Failed to update collaborator license.', code: -3 });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to get collaborator license.', code: -3 });
  }
};
//更新共创者服务器状态
const updateCollabSeverState = async (req, res) => { 
  const { params,license } = req.body;
  try {
    //根据id查询数据库中私钥信息
    const privateKey = await pool.query('SELECT private_key FROM collaborator WHERE id =?', [params.id]);
    if (privateKey.length === 0) {
      return res.json({ msg: '私钥不存在', code: -2 });
    }
    const {createLicenseData} = require('../../helpers/license')
    const result = await createLicenseData(license, privateKey[0].private_key);
    let requst;
    //判断是否有协议
    if(!params.protocol){
      console.log('没有协议');
      return res.json({ msg: '协议错误，切换协议后重试', code: -3 });
    }else{
      try{
        requst = await axios.post(params.protocol+params.domain_name+'/users/updateServerStatus',result)
      }catch(e){
        console.error(e);
        return res.json({ msg: '共创者服务器状态更新失败', code: -3 });
      }
    }
    if(requst.data.code === 0){
      return res.json({msg:'success', code: 0 });
    }
    return res.json({ msg: '共创者服务器状态更新失败', code: -3 });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to get collaborator license.', code: -3 });
  }
};
//获取共创者机械码
const getCollabMachineCode = async (req, res) => {
  const data = req.body;
  try {
    //根据id查询数据库中私钥信息
    const privateKey = await pool.query('SELECT private_key FROM collaborator WHERE id =?', [data.id]);
    if (privateKey.length === 0) {
      return res.json({ msg: '私钥不存在', code: -2 });
    }
    const {createLicenseData} = require('../../helpers/license')
    const timestamp = new Date().getTime(); // 当前时间戳
    const randomPart = Math.floor(Math.random() * 10000); // 随机数部分
    const result = await createLicenseData(`${timestamp}${randomPart}`, privateKey[0].private_key);
    let requst;
    if(!data.protocol){
      console.log('没有协议');
      return res.json({ msg: '协议错误，切换协议后重试', code: -3 });
    }else{
      try{
        requst = await axios.post(data.protocol+data.domain_name+'/users/getMachineCode',result)
      }catch(e){
        console.error(e);
        return res.json({ msg: '获取共创者机械码失败', code: -3 });
      }
    }
    if(requst.data.code === 0){
      return res.json({msg:'success', data:requst.data.data, code: 0 });
    }
    return res.json({ msg: '获取共创者机械码失败', code: -3 });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to get collaborator license.', code: -3 });
  }
}

//获取机器码
const getMachineCode = async (req, res) => {
  const data = req.body;
  const {getMachineId,verifyLicenseData} = require('../../helpers/license')
  try {
    // 验证参数
    if (!data || !data.data || !data.signature) {
      return res.json({ msg: 'Invalid parameters', code: -400 });
    }
    // 验证签名
    const isValid = await verifyLicenseData(data);
    if (!isValid) {
      return res.json({ msg: 'Invalid signature', code: -401 });
    }
    return res.json({ msg: 'Machine code generated successfully.', code: 0, data: { machine_code: getMachineId() } });
  }catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to generate license.', code: -3 });
  }
}

// 修改共创者状态信息
const updateCollabState = async (req, res) => {
  const { id, server_status } = req.body;
  try {
    // 验证参数
    if (!id || server_status === undefined) {
      return res.json({ msg: 'Invalid parameters', code: -400 });
    }
    // 更新数据库中的状态
    const result = await pool.query(
      'UPDATE collaborator SET server_status = ? WHERE id = ?',
      [server_status, id]
    );

    // 检查更新是否成功
    if (result.affectedRows === 0) {
      return res.json({ msg: 'Collaborator not found', code: -404 });
    }

    res.json({ msg: 'State updated successfully', code: 0 });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to update collab state.', code: -3 });
  }
}
//给用户添加余额
const addBalance = async (req, res) => {
  try {
    const { generateOrderNo } = require('../../utils/utils')
    const { data, balance } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //金额换算成分
    const balanceCent = balance * 100;
    //创建订单
    const order = {
      method:'wechat',
      product_type:0,
      product_id:0,
      coupon_code:'',
      order_no:"",
      title:balanceCent < 0?"减少金额":"增加金额",
      description:balanceCent < 0?"管理员减少金额":"管理员增加金额",
      amount: Math.abs(balanceCent), //金额
      status:balanceCent < 0?data.showOrders?5:6:4, //发放成功
      refund_status: balanceCent < 0 ? 2 : 0, // 负数为退款状态(2)，正数为正常状态(0)
      expired_time:null,
      notify_url:"",
      client_ip:clientIp,
      user_id:req.user_id,
      user_name:req.user_name,
      merchant_id:data.id,
      merchant_name:data.username,
      create_time:new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    //生成订单编号
    order.order_no = generateOrderNo();
    order.sdk_order_result = JSON.stringify(order.order_no);
    await pool.query('INSERT INTO pay_order set ?', [order])
    // 更新用户余额
    const result =  await pool.query('UPDATE users_info SET balance = balance +? WHERE user_id =?', [balanceCent, data.id])
    //检测是否更新成功
    if (result.affectedRows === 0) {
      return res.json({ msg: '更新用户余额失败', code: -1 });
    }

    res.json({ msg: 'Success', code: 0 });
  }catch (error) {
    console.log(error);
    console.error(error);
    res.json({ msg: 'Failed to update balance.', code: -3 });
  }
}

//管理员获取评论举报列表
const getCommentReports = async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user_role != 1) {
      return res.json({ code: -1, msg: '没有权限访问' });
    }

    // 获取查询参数
    const { size = '10', current = '1', sortField = 'create_time', asc = 'false', status,reason,reporter_id } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key] !== '' && queryParams[key] !== null && queryParams[key] !== undefined) {
          if (key === 'status') {
            conditions.push('cr.status = ?');
            params.push(queryParams[key]);
          } else if (key === 'reason') {
            conditions.push('cr.reason LIKE ?');
            params.push(`%${queryParams[key]}%`);
          } else if (key === 'reporter_id') {
            conditions.push('cr.user_id = ?');
            params.push(queryParams[key]);
          } else {
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
    const { whereClause, whereParams } = buildWhereClause({ status,reason,reporter_id });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(
      `SELECT COUNT(*) as total FROM comment_reports cr ${whereClause}`,
      whereParams
    );
    const total = Number(totalRows[0].total);

    // 分页查询
    const rows = await pool.query(
      `SELECT cr.*, 
              c.content as comment_content,
              c.project_id,
              c.project_type,
              u.username as reporter_name,
              a.username as admin_name
       FROM comment_reports cr
       LEFT JOIN comment c ON cr.comment_id = c.id
       LEFT JOIN users u ON cr.user_id = u.id
       LEFT JOIN users a ON cr.admin_id = a.id
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      create_time: formatDateTimeSync(row.create_time),
      handle_time: row.handle_time ? formatDateTimeSync(row.handle_time) : null
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch comment reports list.', code: -500 });
  }
};

//管理员处理评论举报
const handleCommentReport = async (req, res) => {
  const { report_id, action, remark = '' } = req.body;
  
  // 检查管理员权限
  if (req.user_role != 1) {
    return res.json({ code: -1, msg: '没有权限操作' });
  }
  
  if (!report_id || !action) {
    return res.json({ code: -2, msg: '参数缺失' });
  }
  
  // action: 1-删除评论，2-驳回举报
  if (action !== 1 && action !== 2) {
    return res.json({ code: -3, msg: '无效的操作类型' });
  }
  
  try {
    // 检查举报记录是否存在
    const report = await pool.query(
      'SELECT * FROM comment_reports WHERE id = ? AND status = 0',
      [report_id]
    );
    
    if (report.length === 0) {
      return res.json({ code: -4, msg: '举报记录不存在或已处理' });
    }
    
    const reportData = report[0];
    
    // 更新举报记录状态
    await pool.query(
      'UPDATE comment_reports SET status = ?, admin_id = ?, handle_time = NOW() WHERE id = ?',
      [action === 1 ? 1 : 2, req.user_id, report_id]
    );
    
    if (action === 1) {
      // 删除评论
      const comment_id = reportData.comment_id;
      
      // 删除该评论的所有子评论（级联删除）
      await pool.query('DELETE FROM comment WHERE parent_id = ?', [comment_id]);
      
      // 删除该评论的点赞记录
      await pool.query('DELETE FROM comment_likes WHERE comment_id = ?', [comment_id]);
      
      // 更新该评论的所有举报记录状态为已处理（删除评论）
      await pool.query(
        'UPDATE comment_reports SET status = 1, admin_id = ?, handle_time = NOW() WHERE comment_id = ? AND status = 0',
        [req.user_id, comment_id]
      );
      
      // 删除评论本身
      await pool.query('DELETE FROM comment WHERE id = ?', [comment_id]);
    }
    
    res.json({ code: 0, msg: action === 1 ? '评论已删除' : '举报已驳回' });
  } catch (error) {
    console.error(error);
    res.json({ code: -500, msg: 'Database error' });
  }
}

//后台评论列表
const getCommentList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false',project_id,project_type,project_name,user_id,publisher_name } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    // 获取总记录数
    const totalRows = await pool.query('SELECT COUNT(*) AS total FROM comment');
    const total = Number(totalRows[0].total);


    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key]) {
          if(key === 'project_id'){
            conditions.push(`c.project_id = ?`);
            params.push(queryParams[key]);
          }else if(key === 'project_type'){
            conditions.push(`c.project_type = ?`);
            params.push(queryParams[key]);
          }else if(key === 'project_name'){
            conditions.push(`(CASE WHEN c.project_type = 0 THEN up.plugin_name ELSE ur.res_name END) LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }else if(key === 'user_id'){
            conditions.push(`c.user_id = ?`);
            params.push(queryParams[key]);
          }else if(key === 'publisher_name'){
            conditions.push(`u.username LIKE ?`);
            params.push(`%${queryParams[key]}%`);
          }else{
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
    const { whereClause, whereParams } = buildWhereClause({ project_id,project_type,project_name,user_id,publisher_name });

    console.log(whereClause);

    // 分页查询
    const rows = await pool.query(
      `SELECT c.*, u.username as publisher_name,
              CASE 
                WHEN c.project_type = 0 THEN up.plugin_name
                ELSE ur.res_name
              END as project_name
       FROM comment c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN upload up ON c.project_type = 0 AND c.project_id = up.id
       LEFT JOIN upload_resources ur ON c.project_type > 0 AND c.project_id = ur.id
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      parentId:row.parent_id,
      create_time: row.create_time?formatDateTimeSync(row.create_time):null,
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch user list.', code: -500 });
  }
}
//获取新消息未审核等……
const getNewMessage = async (req,res) => {
  try {
    let user =[]
    let shop = []
    let disc = []
    let enterprise = []
    //1、获取创作用户待审核信息
    const resultUser = await pool.query('SELECT 1 FROM users_info WHERE state = 1');
    if(resultUser.length>0){
      user = ['UserManager','CreationUserList']
    }
    //2、获取应用市场待审核信息
    const resultShop = await pool.query('SELECT 1 FROM upload_tmp');
    if(resultShop.length>0){
      shop.push('MultipleRevisions')
    }
    //3、获取插件市场待审核信息
    const resultPlugin = await pool.query('SELECT 1 FROM upload_resources_tmp');
    if(resultPlugin.length>0){
      shop.push('ReviewModelPluginWorkFlow')
    }
    //4、获取折扣待审核信息
    const resultDisc = await pool.query('SELECT 1 FROM coupon_apply WHERE status = 0');
    if(resultDisc.length>0){
      disc = ['DiscountManager','DiscountReview']
    }
    //5、获取企业待审核信息
    const resultEnterprise = await pool.query('SELECT 1 FROM business_entities WHERE status = 0');
    if(resultEnterprise.length>0){
      enterprise.push('RegEnterpriseList')
    }
    //6、获取企业人员退出申请信息
    const resultQuit = await pool.query('SELECT 1 FROM business_entity_members WHERE join_status IN (0,2)');
    if(resultQuit.length>0){
      enterprise.push('EnterpriseMembers')
    }
    //判断企业是否有值
    if(enterprise.length>0){
      enterprise.push('EnterpriseManager')
    }
    //判断shop是否有值
    if(shop.length>0){
      shop.push('ShopManager')
    }
    let data = [...user,...shop,...disc,...enterprise]
    return res.json({ msg: 'success', code: 0, data: data});
  }catch (error) {
    console.error(error);
    return res.json({ msg: 'Failed to fetch user list.', code: -500 });
  }
}

//后台获取企业列表
const getEnterpriseList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'created_at', asc = 'false', name, code, status, creator_name,legal_person_name,credit_code } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    // 构建查询条件
    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key] !== undefined && queryParams[key] !== '') {
          if (key === 'status') {
            conditions.push(`${pool.escapeId(key)} = ?`);
            params.push(queryParams[key]);
          } else {
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

    // 获取总记录数
    const { whereClause: countWhereClause, whereParams: countWhereParams } = buildWhereClause({ name, code, status, creator_name,legal_person_name,credit_code });
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM business_entities ${countWhereClause}`, countWhereParams);
    const total = Number(totalRows[0].total);

    // 分页查询
    const { whereClause, whereParams } = buildWhereClause({ name, code, status, creator_name,legal_person_name,credit_code });
    const rows = await pool.query(
      `SELECT id, name, code, description, credit_code, legal_person_name, status, reject_reason, 
              submit_date, audit_date, creator_id, creator_name, creator_email, 
              bank_card, bank_name, member_count, created_at, updated_at,
              business_license_url, id_card_front_url, id_card_back_url
       FROM business_entities
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      submit_date: row.submit_date ? formatDateTimeSync(row.submit_date) : null,
      audit_date: row.audit_date ? formatDateTimeSync(row.audit_date) : null,
      created_at: formatDateTimeSync(row.created_at),
      updated_at: row.updated_at ? formatDateTimeSync(row.updated_at) : null
    }));

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
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch enterprise list.', code: -500 });
  }
}
//后台企业审核
const enterpriseReview = async (req, res) => {
  try {
    const { id, status, reject_reason } = req.body;
    
    // 参数验证
    if (!id || status === undefined) {
      return res.json({ msg: 'Missing required parameters', code: -400 });
    }
    
    // 验证状态值：0-待审核，1-已审核，2-未通过
    if (![0, 1, 2].includes(parseInt(status))) {
      return res.json({ msg: 'Invalid status value. Status must be 0, 1, or 2.', code: -400 });
    }
    
    // 如果状态为未通过(2)，必须提供拒绝原因
    if (parseInt(status) === 2 && (!reject_reason || reject_reason.trim() === '')) {
      return res.json({ msg: 'Reject reason is required when status is 2', code: -400 });
    }
    
    // 更新企业审核状态
    const updateQuery = `
      UPDATE business_entities 
      SET status = ?, 
          reject_reason = ?, 
          audit_date = NOW() 
      WHERE id = ?
    `;
    
    const result = await pool.query(updateQuery, [
      parseInt(status),
      parseInt(status) === 2 ? reject_reason : null,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.json({ msg: 'Enterprise not found', code: -404 });
    }
    
    res.json({ msg: 'success', code: 0 });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to update enterprise review status.', code: -500 });
  }
}
//后台企业删除
const deleteEnterprise = async (req, res) => {
  try {
    const { id } = req.body;
    
    // 参数验证
    if (!id) {
      return res.json({ msg: 'Missing required parameter: id', code: -400 });
    }
    
    // 查询企业是否存在
    const enterpriseInfo = await pool.query(
      'SELECT * FROM business_entities WHERE id = ?',
      [id]
    );
    
    if (enterpriseInfo.length === 0) {
      return res.json({ msg: 'Enterprise not found', code: -404 });
    }
    
    const enterprise = enterpriseInfo[0];
    
    // 删除企业相关的图片文件
    const fsPromises = require('fs').promises;
    
    // 删除营业执照图片
    if (enterprise.business_license_url) {
      try {
        await fsPromises.unlink('./userinfo/' + enterprise.business_license_url);
        console.log(`Business license image deleted: ${enterprise.business_license_url}`);
      } catch (error) {
        console.error(`Error deleting business license image: ${error.message}`);
      }
    }
    
    // 删除身份证正面图片
    if (enterprise.id_card_front_url) {
      try {
        await fsPromises.unlink('./userinfo/' + enterprise.id_card_front_url);
        console.log(`ID card front image deleted: ${enterprise.id_card_front_url}`);
      } catch (error) {
        console.error(`Error deleting ID card front image: ${error.message}`);
      }
    }
    
    // 删除身份证背面图片
    if (enterprise.id_card_back_url) {
      try {
        await fsPromises.unlink('./userinfo/' + enterprise.id_card_back_url);
        console.log(`ID card back image deleted: ${enterprise.id_card_back_url}`);
      } catch (error) {
        console.error(`Error deleting ID card back image: ${error.message}`);
      }
    }
    
    // 删除企业成员记录
    await pool.query(
      'DELETE FROM business_entity_members WHERE entity_id = ?',
      [id]
    );
    
    // 删除企业审核日志记录（如果存在）
    await pool.query(
      'DELETE FROM business_entity_audit_logs WHERE entity_id = ?',
      [id]
    );
    
    // 删除企业主记录
    const deleteResult = await pool.query(
      'DELETE FROM business_entities WHERE id = ?',
      [id]
    );
    
    if (deleteResult.affectedRows === 0) {
      return res.json({ msg: 'Failed to delete enterprise', code: -500 });
    }
    
    res.json({ 
      msg: 'Enterprise deleted successfully', 
      code: 0,
      data: {
        deletedEnterpriseId: id,
        enterpriseName: enterprise.name
      }
    });
    
  } catch (error) {
    console.error('Delete enterprise error:', error);
    res.json({ msg: 'Database error', code: -500 });
  }
}
//后台获取企业人员列表
const getEnterpriseUserList = async (req, res) => {
  try {
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'created_at', asc = 'false', entity_name, user_name, user_email, role, join_status } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    // 构建查询条件
    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key) && queryParams[key] !== undefined && queryParams[key] !== '') {
          if (key === 'role' || key === 'join_status') {
            // 对于数字字段使用精确匹配
            conditions.push(`${pool.escapeId(key)} = ?`);
            params.push(queryParams[key]);
          } else {
            // 对于字符串字段使用模糊匹配
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

    const { whereClause, whereParams } = buildWhereClause({ entity_name, user_name, user_email, role, join_status });

    // 获取总记录数
    const totalRows = await pool.query(`SELECT COUNT(*) AS total FROM business_entity_members ${whereClause}`, whereParams);
    const total = Number(totalRows[0].total);

    // 分页查询企业人员列表
    const rows = await pool.query(
      `SELECT 
         id, entity_id, entity_code, entity_name,
         user_id, user_name, user_email, role,
         join_date, join_status, created_at, updated_at
       FROM business_entity_members
       ${whereClause}
       ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
       LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 格式化数据
    const data = rows.map(row => ({
      ...row,
      role_text: row.role === 0 ? '创建者' : '普通成员',
      join_status_text: row.join_status === 0 ? '申请加入' : row.join_status === 1 ? '正常' : '申请退出',
      join_date: formatDateTimeSync(row.join_date),
      created_at: formatDateTimeSync(row.created_at),
      updated_at: row.updated_at ? formatDateTimeSync(row.updated_at) : null
    }));

    // 发送响应
    res.json({
      msg: 'success',
      code: 0,
      data: {
        total,
        size,
        current,
        records: data
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: 'Failed to fetch enterprise user list.', code: -500 });
  }
}
//后台企业人员删除
const deleteEnterpriseUser = async (req, res) => {
  try {
    const { id } = req.body;
    
    // 参数验证
    if (!id) {
      return res.json({ msg: 'Missing required parameter: id', code: -400 });
    }
    
    // 查询企业人员是否存在
    const memberInfo = await pool.query(
      'SELECT * FROM business_entity_members WHERE id = ?',
      [id]
    );
    
    if (memberInfo.length === 0) {
      return res.json({ msg: 'Enterprise member not found', code: -404 });
    }
    
    const member = memberInfo[0];
    
    // 检查是否为企业创建者（创建者不能被删除）
    if (member.role === 0) {
      return res.json({ msg: '创建者不能被删除', code: -403 });
    }
    
    // 删除企业成员记录
    const deleteResult = await pool.query(
      'DELETE FROM business_entity_members WHERE id = ?',
      [id]
    );
    
    if (deleteResult.affectedRows === 0) {
      return res.json({ msg: 'Failed to delete enterprise member', code: -500 });
    }

    // 删除企业成员 申请记录
    await pool.query('DELETE FROM business_entity_audit_logs WHERE entity_id = ? AND auditor_id = ?', [member.entity_id, member.user_id]);
    
    // 更新企业成员数量（如果成员状态为正常）
    if (member.join_status === 1 || member.join_status === 2) {
      await pool.query(
        'UPDATE business_entities SET member_count = member_count - 1 WHERE id = ?',
        [member.entity_id]
      );
    }
    
    res.json({ 
      msg: 'Enterprise member deleted successfully', 
      code: 0,
      data: {
        deletedMemberId: id,
        memberName: member.user_name,
        enterpriseName: member.entity_name
      }
    });
    
  } catch (error) {
    console.error('Delete enterprise member error:', error);
    res.json({ msg: 'Database error', code: -500 });
  }
}
//后台查询用户退出原因
const getQuitEnterpriseReason = async (req, res) => {
  try {
    const { entity_id,auditor_id } = req.body;
    const result = await pool.query(
      'SELECT * FROM business_entity_audit_logs WHERE entity_id = ? AND auditor_id = ? AND new_status = 2',
      [entity_id,auditor_id]
    );
    if (result.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '未找到该用户的退出原因'
      });
    }
    res.json({ msg: 'Success', code: 0, data: result[0].audit_reason });
  }catch (error) {
    console.error('Delete enterprise member error:', error);
    res.json({ msg: 'Database error', code: -500 });
  }
}
//后台驳回企业人员退出申请
const rejectQuitEnterprise = async (req, res) => {
  try {
    const { id } = req.body;
    
    // 参数验证
    if (!id) {
      return res.json({ msg: 'Missing required parameter: id', code: -400 });
    }
    // 查询企业成员是否存在
    const memberInfo = await pool.query(
      'SELECT * FROM business_entity_members WHERE id = ?',
      [id]
    );
    
    if (memberInfo.length === 0) {
      return res.json({ msg: 'Enterprise member not found', code: -404 });
    }
    
    const member = memberInfo[0];
    
    // 检查成员状态是否为申请退出状态
    if (member.join_status !== 2) {
      return res.json({ msg: 'Member is not in quit application status', code: -400 });
    }
    
    // 拒绝退出申请，将状态改回正常
    const updateResult = await pool.query(
      'UPDATE business_entity_members SET join_status = 1, updated_at = NOW() WHERE id = ?',
      [id]
    );

    // 删除企业成员 申请记录
    await pool.query('DELETE FROM business_entity_audit_logs WHERE entity_id = ? AND auditor_id = ? AND new_status = 2', [member.entity_id, member.user_id]);
    
    if (updateResult.affectedRows === 0) {
      return res.json({ msg: 'Failed to reject quit application', code: -500 });
    }
    
    res.json({ 
      msg: 'Quit application rejected successfully', 
      code: 0,
      data: {
        memberId: id,
        memberName: member.user_name,
        enterpriseName: member.entity_name
      }
    });
    
  } catch (error) {
    console.error('Reject quit enterprise error:', error);
    res.json({ msg: 'Database error', code: -500 });
  }
}
//后台申请通过加入企业
const approveJoinEnterprise = async (req, res) => {
  try {
    const { id } = req.body;
    
    // 参数验证
    if (!id) {
      return res.json({ msg: 'Missing required parameter: id', code: -400 });
    }
    
    // 查询企业成员是否存在
    const memberInfo = await pool.query(
      'SELECT * FROM business_entity_members WHERE id = ?',
      [id]
    );
    
    if (memberInfo.length === 0) {
      return res.json({ msg: 'Enterprise member not found', code: -404 });
    }
    
    const member = memberInfo[0];
    
    // 检查成员状态是否为申请加入状态
    if (member.join_status !== 0) {
      return res.json({ msg: 'Member is not in join application status', code: -400 });
    }
    
    // 检查企业是否存在且已通过审核
    const enterpriseInfo = await pool.query(
      'SELECT status FROM business_entities WHERE id = ?',
      [member.entity_id]
    );
    
    if (enterpriseInfo.length === 0) {
      return res.json({ msg: 'Enterprise not found', code: -404 });
    }
    
    if (enterpriseInfo[0].status !== 1) {
      return res.json({ msg: 'Enterprise is not approved yet', code: -400 });
    }
    
    // 批准加入申请，将状态改为正常
    const updateResult = await pool.query(
      'UPDATE business_entity_members SET join_status = 1, updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.json({ msg: 'Failed to approve join application', code: -500 });
    }
    
    // 更新企业成员数量
    await pool.query(
      'UPDATE business_entities SET member_count = member_count + 1 WHERE id = ?',
      [member.entity_id]
    );
    
    // 记录审核日志（可选）
    await pool.query(
      `INSERT INTO business_entity_audit_logs 
       (entity_id, entity_code, entity_name, audit_type, old_status, new_status, audit_reason, created_at, auditor_id, auditor_name) 
       VALUES (?, ?, ?, 1, 0, 1, '管理员批准用户加入企业', NOW(), ?, ?)`,
      [member.entity_id, member.entity_code, member.entity_name, req.user_id || 0, req.user_name || 'Admin']
    );
    
    res.json({ 
      msg: 'Join application approved successfully', 
      code: 0,
      data: {
        memberId: id,
        memberName: member.user_name,
        enterpriseName: member.entity_name,
        joinStatus: 1
      }
    });
    
  } catch (error) {
    console.error('Approve join enterprise error:', error);
    res.json({ msg: 'Database error', code: -500 });
  }
}
module.exports = {
  getNewMessage,// 获取新消息未审核等……
  getUserInfo, // 获取用户信息
  getMenuList, // 获取菜单列表
  getRegUserList, // 获取注册用户列表
  getCreativeUserList,// 获取待审核个人信息的用户
  setCreativeUserState,// 设置待审核个人信息的用户状态
  getUserAllInfo, // 获取用户所有信息
  unbindParentInviteCode, // 解绑邀请码
  bindParentInviteCode, // 绑定邀请码
  updateUserState, // 更新用户状态
  getAIProjectList, // 获取AI项目列表
  delAIProjec, // 删除AI项目
  setProjectReviewStatus, // 设置项目审核状态
  getDashBoardInfo, // 获取DashBoard数据
  getOssAliConfig, // 获取阿里云配置
  updateOssAliConfig, // 更新阿里云配置

  getOss123Config, // 获取123网盘云配置
  updateOss123Config, // 更新123网盘云配置


  updateAIProject, // 更新项目
  getAIProjectFilter, // 获取筛选数据
  updateAIProjectFilter, // 更新筛选数据
  deleteAIProjectFilter, // 删除筛选数据
  uploadImage, // 上传图片

  addBalance, // 给用户添加余额
  resetPassword, // 重置密码

  forgotPasswordByEmail, // 前端忘记密码修改密码
  changePassword, // 前端修改密码

  getVersionInfo, // 后端接口 获取版本更新信息
  getVersionInfo2, // 后端接口 获取版本更新信息 (非强制更新)
  getBannerInfo, // 后端接口 获取轮播图信息
  getAppInfo, // 获取新版本更新信息，以及轮播图等……
  updateNewVersionInfo, // 修改新版本更新信息
  updateNewVersionInfo2, // 修改新版本更新信息 (非强制更新)
  bannerUpload, // 轮播图图片上传
  updateBannerInfo, // 修改轮播图信息

  getUserProjectData, // 前端用户项目数据
  deleteUserProjectData, // 前端用户项目数据删除
  getUserResourcesData, // 前端用户资源数据
  deleteUserResourcesData, // 前端用户资源数据删除

  getUserWalletData, // 前端获取用户钱包数据
  getUserIncomeData, // 前端获取用户收益相关
  checkProjectDir, // 前端判断项目目录是否存在
  checkResDir, // 前端判断资源目录是否存在

  checksharedlink, //前端分享链接校验

  marketList,  //前端审核市场软件列表
  marketAppInfo, //前端审核获取AI项目详情

  marketResList, //前端审核资源列表
  marketResInfo, //前端审核获取资源详情

  getShareCfg, //后端分享界面信息获取
  updateShareCfg, //后端分享界面信息修改

  //=====================上传临时表=======================
  getAIProjectListtmp, // 获取临时项目列表
  updateAIProjecttmp, // 更新临时项目
  delAIProjectmp, // 删除临时项目
  setProjectReviewStatustmp, // 设置临时项目审核状态
  uploadImagetmp, // 上传图片

  //=====================模型，插件，工作流=======================
  getResList, // 获取资源列表
  delRes, // 删除资源 
  setResReviewStatus, // 设置资源审核状态
  updateRes, // 更新资源
  updateResFilter, // 更新过滤器 
  deleteResFilter, // 删除过滤器
  getResFilter, // 获取过滤器列表
  uploadImageRes, // 上传图片

  //======================模型，插件，工作流 上传临时表=======================
  getResListtmp, // 获取资源列表
  updateRestmp, // 更新资源
  delRestmp, // 删除资源
  setResReviewStatustmp, // 设置资源审核状态
  uploadImageRestmp, // 上传图片

  //=====================共创者=======================
  getCollaboratorlist, // 后端获取共创者信息
  addCollab, // 后端添加共创者信息
  editCollab, // 后端修改共创者信息
  delCollab, // 后端删除共创者信息
  getCollaboratorStatus, // 共创者获取状态
  updateCollabState, // 修改共创者状态信息
  updateServerStatus, // 远程修改服务器状态接口（原始公司用）
  getLicenseFile, // 远程获取license文件接口（原始公司用）
  updateLicenseFile, // 远程更新license文件接口（原始公司用）
  collaboratorsetting, // 修改共创者相关信息接口（共创者用）
  getCollabLicense, //获取共创者加密文件信息
  updateCollabLicense, //更新共创者加密文件信息
  updateCollabSeverState, //更新共创者服务器状态
  getCollabMachineCode, //获取共创者机器码
  //=====================license 文件 ========================
  getMachineCode, // 获取机器码
  //=====================评论举报 ========================
  getCommentReports,//管理员获取评论举报列表
  handleCommentReport,//管理员处理评论举报
  getCommentList,//后台评论列表
  //=====================企业部分========================
  getEnterpriseList,//后台获取企业列表
  enterpriseReview,//后台企业审核
  deleteEnterprise,//后台删除企业
  getEnterpriseUserList,//后台获取企业用户列表
  deleteEnterpriseUser,//后台删除企业用户
  getQuitEnterpriseReason,//后台获取退出原因
  rejectQuitEnterprise,//后台驳回企业人员退出申请
  approveJoinEnterprise,//后台审核企业人员加入申请
}
