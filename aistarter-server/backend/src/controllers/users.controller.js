const pool = require('../database')
const fs = require('fs');
const path = require('path');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);
const { isAdmin, userInfoByToken,oneTwoThreePanSignURL,detectOperatingSystem,formatDateTimeSync,verifyPassword } = require('../helpers/functions')
const { readConfig, writeConfig } = require('../helpers/storage')
const { checkPurchaseStatus,checkResPurchaseStatus } = require('../helpers/order')
const { formatDate,generateRefundNo,formatToMySQLDateTime,isContainsLink,containsBannedWords,generateInviteCode } = require('../utils/utils')
const requestLimitMap = new Map(); // 限制请求频率
const info = async (req, res) => {
  
  const user = {}

  user.id = req.user_id
  user.email = req.user_email

  //获取平台配置V2
  let payConfig = await readConfig("pay_platform_cfg_v2");
  if(!payConfig){
      payConfig = require("../datas/pay_platform_cfg_v2.data")
  }

  // 获取前端传入的机器码
  const machine_code = req.body.machine_code || req.query.machine_code;
  // 获取前端传入的设备名
  const machine_name = req.body.machine_name || req.query.machine_name;
  // 获取前端传入的设备类型
  const machine_type = req.body.machine_type || req.query.machine_type;

  try {
    const userData = await pool.query(
      'SELECT u.*, ui.avatar_url,ui.state as InfoState FROM users u LEFT JOIN users_info ui ON u.id = ui.user_id WHERE u.id = ?',
      [req.user_id]
    );
    if (machine_code) {
      // 查询该用户是否已用过该机器码
      const exist = await pool.query('SELECT 1 FROM user_machines WHERE user_id = ? AND machine_code = ?', [req.user_id, machine_code]);
      if (!exist.length) {
        // 新设备，插入记录并+1
        await pool.query('INSERT INTO user_machines (user_id, machine_code,machine_name,machine_type) VALUES (?, ?,?,?)', [req.user_id, machine_code,machine_name,machine_type]);
        await pool.query('UPDATE users SET machine_count = machine_count + 1, machine_code = ? WHERE id = ?', [machine_code, req.user_id]);
        user.machine_count = userData[0].machine_count+1;
      } else {
        // 老设备，仅更新最后一次登录机器码
        await pool.query('UPDATE users SET machine_code = ? WHERE id = ?', [machine_code, req.user_id]);
        user.machine_count = userData[0].machine_count;
      }
    }
  
    if(userData.length > 0){
      user.vip_type = userData[0].vip_type;
      user.vip_expire_time = userData[0].vip_expire_time;
      user.id_role = userData[0].id_role;
      user.machine_code = userData[0].machine_code;
      user.avatar = userData[0].avatar_url;
      user.InfoState = userData[0].InfoState;
      user.status = userData[0].status;
      user.ban_expire_time = userData[0].ban_expire_time?formatDate(userData[0].ban_expire_time):'';
      user.reason = userData[0].reason
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Database error",code:400 });
  }
  user.machine_code_count_over = false;
  // 只对有效会员用户限制机器数量（永久会员vip_type=2不检查过期时间）
  const now = new Date();
  const isValidVip = user.vip_type > 0 && (user.vip_type === 2 || (user.vip_expire_time && new Date(user.vip_expire_time) > now));
  if(isValidVip && payConfig.machine_code_count < user.machine_count){
    user.machine_code_count_over = true;
  }
  return res.status(200).json({ user })
}

const upload = async(req, res) => {
  let fileObj = null;
  let filePath = '';

  if(!req.files || Object.keys(req.files).length === 0) {
   res.status(400).json({
     msg: 'Bad Request.'
   })
   return;
  }

  return res.status(400).json({ error:"api error!" });

  // 解析 mainJson 数据
  const mainJson = JSON.parse(req.body.mainJson);
  console.log(mainJson);

  // 验证mainJson字段
  const regex = /^[a-zA-Z0-9_-]+$/; // 支持字母、数字、下划线和破折号
  if (!regex.test(mainJson.install_dir)) {
      res.status(400).json({
          error: 'The install_dir field only allows letters, numbers, underscores, and hyphens!'
      });
      return;
  }

  /* file 是上传时候body中的一个字段，有可以随意更改*/
  // console.log(req.files, req.files.file)
  fileObj = req.files.file;

  let userDir = './upload/' + req.user_id + "/";
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

  filePath = userDir + mainJson.install_dir + '.zip';
  fileObj.mv(filePath, async (err) => {
    if(err) {
      return res.status(400).json({
        error: 'System error'
      })
    }

    // 查询数据库是否存在符合条件的数据
    try {
      const existingData = await pool.query('SELECT * FROM upload WHERE user_id = ? AND install_dir = ?', [req.user_id, mainJson.install_dir]);
      if (existingData.length > 0) {
        // 如果存在符合条件的数据，则更新该数据
        await pool.query('UPDATE upload SET state = 0, plugin_name = ?, user_name = ?, description = ?, version = ?, author = ?, platforms = ?, project_zip_size = ? WHERE user_id = ? AND install_dir = ?', [mainJson.name, req.user_name, mainJson.description, mainJson.version, mainJson.author, mainJson.platforms.join(','), mainJson.project_zip_size, req.user_id, mainJson.install_dir]);
      } else {
        // 如果不存在符合条件的数据，则插入新数据
        const data = {
          user_id:  req.user_id,
          plugin_name: mainJson.name,
          description: mainJson.description,
          version: mainJson.version,
          author: mainJson.author,
          platforms: mainJson.platforms.join(','),
          install_dir: mainJson.install_dir,
          like_count: 0,
          download: 0,
          user_name: req.user_name,
          project_zip_size: mainJson.project_zip_size,
          create_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        await pool.query('INSERT INTO upload SET ?', [data]);
      }
      res.status(200).json({
        data: 'Upload Successfuly'
      });
    } catch (error) {
      console.log(error)
      res.status(400).json({ error:"database error" });
    }
  })
}

const uploadV2 = async(req, res) => {
  let fileObj = null;
  let filePath = '';

  if(!req.files || Object.keys(req.files).length === 0) {
   res.status(400).json({
     msg: 'Bad Request.'
   })
   return;
  }

  // 解析 mainJson 数据
  const mainJson = JSON.parse(req.body.mainJson);
  console.log(mainJson);
  // 解析发布参数
  const publicOption = JSON.parse(req.body.publicOption);
  // console.log(publicOption);

  // 验证mainJson字段
  const regex = /^[a-zA-Z0-9_-]+$/; // 支持字母、数字、下划线和破折号
  if (!regex.test(mainJson.install_dir)) {
      res.status(400).json({
          error: 'The install_dir field only allows letters, numbers, underscores, and hyphens!'
      });
      return;
  }

  let userDir = './upload_tmp/' + req.user_id + "/";
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
  let imagePath = userDir + mainJson.install_dir + '.png';
  let imageObj = req.files.image;
  imageObj.mv(imagePath, async (err) => {
    if(err){
      console.error("Update load image error:" + imagePath);
    }
  });

  /* file 是上传时候body中的一个字段，有可以随意更改*/
  // console.log(req.files, req.files.file)
  fileObj = req.files.file;

  filePath = userDir + mainJson.install_dir + '.zip';
  fileObj.mv(filePath, async (err) => {
    if(err) {
      return res.status(400).json({
        error: 'System error'
      })
    }

    //图标路径
    let tmpImagePath = req.user_id + '/' + mainJson.install_dir + ".png";
    let tmpNeedDevice = "";
    if(publicOption["gupRadio"].length > 0){
      tmpNeedDevice = publicOption["gupRadio"].join(',');
    }

    //项目简介
    let tmpProjectOverview = "";
    if(publicOption["projectOverview"] && publicOption["projectOverview"] != ""){
      tmpProjectOverview = publicOption["projectOverview"];
    }

    //网盘地址
    let tmpCloudLink = "";
    if(publicOption["cloudLink"] && publicOption["cloudLink"] != ""){
      tmpCloudLink = publicOption["cloudLink"];
    }

    // 查询数据库是否存在符合条件的数据
    try {
      const existingData = await pool.query('SELECT * FROM upload_tmp WHERE user_id = ? AND install_dir = ?', [req.user_id, mainJson.install_dir]);
      if (existingData.length > 0) {
        // 如果存在符合条件的数据，则更新该数据
        await pool.query('UPDATE upload_tmp SET state = 0, plugin_name = ?, user_name = ?, description = ?, version = ?, author = ?, platforms = ?, project_zip_size = ?, price_type = ?, price_value = ?, need_device = ?, image_path = ?, plugn_desc = ?, cloud_storage_link = ?, public_option = ? WHERE user_id = ? AND install_dir = ?', [mainJson.name, req.user_name, mainJson.description, mainJson.version, mainJson.author, mainJson.platforms.join(','), mainJson.project_zip_size, Number(publicOption.priceType),Number(publicOption.priceValue), tmpNeedDevice, tmpImagePath, tmpProjectOverview, tmpCloudLink, req.body.publicOption, req.user_id, mainJson.install_dir]);
      } else {
        // 如果不存在符合条件的数据，则插入新数据
        const data = {
          user_id:  req.user_id,
          plugin_name: mainJson.name,
          description: mainJson.description,
          version: mainJson.version,
          author: mainJson.author,
          platforms: mainJson.platforms.join(','),
          install_dir: mainJson.install_dir,
          like_count: 0,
          download: 0,
          user_name: req.user_name,
          project_zip_size: mainJson.project_zip_size,
          price_type:Number(publicOption.priceType),
          price_value:Number(publicOption.priceValue),
          need_device:tmpNeedDevice,
          image_path:tmpImagePath,
          plugn_desc:tmpProjectOverview,
          cloud_storage_link:tmpCloudLink,
          public_option:req.body.publicOption, //TODO 临时全部保存数据
          create_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        await pool.query('INSERT INTO upload_tmp SET ?', [data]);
      }
      res.status(200).json({
        data: 'Upload Successfuly'
      });
    } catch (error) {
      console.log(error)
      res.status(400).json({ error:"database error" });
    }
  })
}

//模型，插件，工作流上传
const uploadRes = async(req, res) => {
  let fileObj = null;
  let filePath = '';

  if(!req.files || Object.keys(req.files).length === 0) {
   res.status(400).json({
     msg: 'Bad Request.'
   })
   return;
  }

  // 解析 mainJson 数据
  const mainJson = JSON.parse(req.body.mainJson);
  console.log(mainJson);
  // 解析发布参数
  const publicOption = JSON.parse(req.body.publicOption);
  // console.log(publicOption);

  // 验证mainJson字段
  const regex = /^[a-zA-Z0-9_-]+$/; // 支持字母、数字、下划线和破折号
  if (!regex.test(mainJson.install_dir)) {
      res.status(400).json({
          error: 'The install_dir field only allows letters, numbers, underscores, and hyphens!'
      });
      return;
  }

  let userDir = './upload_tmp/'+ publicOption['type'] + "/" + req.user_id + "/";
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
  let imagePath = userDir + mainJson.install_dir + '.png';
  let imageObj = req.files.image;
  imageObj.mv(imagePath, async (err) => {
    if(err){
      console.error("Update load image error:" + imagePath);
    }
  });

  /* file 是上传时候body中的一个字段，有可以随意更改*/
  // console.log(req.files, req.files.file)
  fileObj = req.files.file;

  filePath = userDir + mainJson.install_dir + '.zip';
  fileObj.mv(filePath, async (err) => {
    if(err) {
      return res.status(400).json({
        error: 'System error'
      })
    }

    let restype = "1"
    switch (publicOption.type) {
      case "model":
        restype = "1"
        break;
      case "plugin":
        restype = "2"
        break;
      case "workflow":
        restype = "3"
        break;
    }

    //图标路径
    let tmpImagePath = publicOption['type'] + '/' + req.user_id + '/' + mainJson.install_dir + ".png";

    //项目简介
    let tmpProjectOverview = "";
    if(publicOption["projectOverview"] && publicOption["projectOverview"] != ""){
      tmpProjectOverview = publicOption["projectOverview"];
    }

    //网盘地址
    let tmpCloudLink = "";
    if(publicOption["cloudLink"] && publicOption["cloudLink"] != ""){
      tmpCloudLink = publicOption["cloudLink"];
    }

    // 查询数据库是否存在符合条件的数据
    try {
      const existingData = await pool.query('SELECT * FROM upload_resources_tmp WHERE user_id = ? AND install_dir = ?', [req.user_id, mainJson.install_dir]);
      if (existingData.length > 0) {
        // 如果存在符合条件的数据，则更新该数据
        await pool.query('UPDATE upload_resources_tmp SET state = 0, res_name = ?, user_name = ?, short_desc = ?, version = ?, author = ?, platforms = ?, res_zip_size = ?, price_type = ?, price_value = ?, res_install = ?, image_path = ?, res_desc = ?, cloud_storage_link = ?, ext_option = ? WHERE user_id = ? AND install_dir = ?', [mainJson.name, req.user_name, mainJson.description, mainJson.version, mainJson.author, mainJson.platforms.join(','), mainJson.project_zip_size, Number(publicOption.priceType),Number(publicOption.priceValue),publicOption.resinstall, tmpImagePath, tmpProjectOverview, tmpCloudLink, req.body.publicOption, req.user_id, mainJson.install_dir]);
      } else {
        // 如果不存在符合条件的数据，则插入新数据
        const data = {
          user_id:  req.user_id,
          res_name: mainJson.name,
          short_desc: mainJson.description,
          version: mainJson.version,
          author: mainJson.author,
          platforms: mainJson.platforms.join(','),
          install_dir: mainJson.install_dir,
          like_count: 0,
          download: 0,
          user_name: req.user_name,
          res_zip_size: mainJson.project_zip_size,
          price_type:Number(publicOption.priceType),
          price_value:Number(publicOption.priceValue),
          res_type:restype,
          res_install:publicOption.resinstall,
          image_path:tmpImagePath,
          res_desc:tmpProjectOverview,
          cloud_storage_link:tmpCloudLink,
          ext_option:req.body.publicOption, //TODO 临时全部保存数据
          create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          update_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        await pool.query('INSERT INTO upload_resources_tmp SET ?', [data]);
      }
      res.status(200).json({
        data: 'Upload Successfuly'
      });
    } catch (error) {
      console.log(error)
      res.status(400).json({ error:"database error" });
    }
  })
}

//市场软件列表
const marketList = async (req, res) => {
  try {
    const loadedCount = req.query.loadedCount ? parseInt(req.query.loadedCount) : 0;
    const searchKeyword = req.query.searchKeyword ? req.query.searchKeyword : '';
    const tokenStr = req.query.tk ? req.query.tk : '';
    const orderType = req.query.orderType ? Number(req.query.orderType) : 1;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    const isadmin = await isAdmin(tokenStr);

    let sqlQuery = 'SELECT DISTINCT u.id, u.plugin_name,u.user_id, u.user_name, u.install_dir, u.platforms, u.description, u.version, u.author, u.like_count, u.favorite_count, u.download, u.project_zip_size, u.price_type, u.price_value, u.need_device, u.image_path, u.create_time FROM upload u LEFT JOIN users_info ui ON u.user_id = ui.user_id ';
    let queryParams = [];
    let whereClause = '';

    //判断系统
    let systemName = detectOperatingSystem(req);
    console.log(systemName)
    if(systemName){
      whereClause += `platforms = '${systemName}' AND `;
    }

    if (!isadmin) {
      whereClause += 'u.state = 1 AND ';
    }

    if (searchKeyword) {
      whereClause += '(u.plugin_name LIKE ? OR u.description LIKE ? OR u.user_name LIKE ? OR ui.alias LIKE ?) AND ';
      queryParams.push(`%${searchKeyword}%`);
      queryParams.push(`%${searchKeyword}%`);
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
    } else if (orderType === 4) {
      orderStr = ' ORDER BY favorite_count DESC';
    }

    sqlQuery += orderStr + ' LIMIT ?, 26'; // 添加排序和分页限制
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
// 获取首页发布时获取项目详情
const getMarketDetail = async (req, res) => {
  try {
    const { install_dir,types } = req.query;
    if(!install_dir || !types){
      res.status(400).json({ error: "参数错误" });
      return;
    }
    if(types == 'class'){ //AI项目
      //先查询待审核的
      const marketData = await pool.query(`SELECT id,user_id,user_name,plugin_name,description,version,platforms,like_count,download,state,plugn_desc,public_option,cloud_storage_link FROM upload_tmp WHERE install_dir = ? ORDER BY id DESC`, [install_dir])
      if(marketData.length === 0){ //如果没有待审核的，查询已审核的
        const marketData = await pool.query(`SELECT id,user_id,user_name,plugin_name,description,version,platforms,like_count,download,state,plugn_desc,public_option,cloud_storage_link FROM upload WHERE install_dir = ? ORDER BY id DESC`, [install_dir])
        if(marketData.length === 0){ //如果没有已审核的，返回错误信息
          res.status(204).json({ error: "未找到数据" });
          return;
        }
        return res.status(200).json(marketData[0]); // 如果找到，返回数据
      };
      return res.status(200).json(marketData[0]); // 如果找到，返回数据
    }else{ //模型，插件，工作流
      //先查询待审核的
      const marketData = await pool.query(`SELECT id,user_id,user_name,res_name,short_desc,version,author,like_count,download,state,res_desc,cloud_storage_link,ext_option FROM upload_resources_tmp WHERE install_dir =? ORDER BY id DESC`, [install_dir])
      if(marketData.length === 0){ //如果没有待审核的，查询已审核的
        const marketData = await pool.query(`SELECT id,user_id,user_name,res_name,short_desc,version,author,like_count,download,state,res_desc,cloud_storage_link,ext_option FROM upload_resources WHERE install_dir =? ORDER BY id DESC`, [install_dir])
        if(marketData.length === 0){ //如果没有已审核的，返回错误信息
          res.status(204).json({ error: "未找到数据" });
          return;
        }
        return res.status(200).json(marketData[0]); // 如果找到，返回数据
      }
      return res.status(200).json(marketData[0]); // 如果找到，返回数据
    }
  }catch (error) {
    console.error("Error fetching market list:", error);
  }
};

//市场模型，插件，工作流列表
const marketResourcesList = async (req, res) => {
  try {
    const loadedCount = req.query.loadedCount ? parseInt(req.query.loadedCount) : 0;
    const searchKeyword = req.query.searchKeyword ? req.query.searchKeyword : '';
    const tokenStr = req.query.tk ? req.query.tk : '';
    const orderType = req.query.orderType ? Number(req.query.orderType) : 1;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const resType = req.query.resType ? req.query.resType : 1;

    const isadmin = await isAdmin(tokenStr);

    let sqlQuery = 'SELECT DISTINCT u.id, u.res_name,u.user_id, u.user_name, u.install_dir, u.platforms, u.short_desc, u.version, u.author, u.like_count, u.favorite_count, u.download, u.res_zip_size, u.price_type, u.price_value, u.res_type, u.image_path, u.create_time, u.ext_option FROM upload_resources u LEFT JOIN users_info ui ON u.user_id = ui.user_id ';
    let queryParams = [];
    let whereClause = '';

    if (!isadmin) {
      whereClause += 'u.state = 1 AND ';
    }

    if (searchKeyword) {
      whereClause += '(u.res_name LIKE ? OR u.short_desc LIKE ? OR u.user_name LIKE ? OR ui.alias LIKE ?) AND ';
      queryParams.push(`%${searchKeyword}%`);
      queryParams.push(`%${searchKeyword}%`);
      queryParams.push(`%${searchKeyword}%`);
      queryParams.push(`%${searchKeyword}%`);
    }
    // 处理系统筛选
    if (filters.system && filters.system != "") {
      const Platforms = filters.system;
      whereClause += `u.platforms = ? AND `;
      queryParams.push(Platforms);
    }

    //处理类型筛选
    if (resType && resType != "") {
      whereClause += `u.res_type = ? AND `;
      queryParams.push(resType);
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
      // 确保 filterValues 是数组
      const valuesArray = Array.isArray(filterValues) ? filterValues : [filterValues];
      if (valuesArray.length > 0) {
        const uniqueFilterValues = Array.from(new Set(valuesArray));
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
    } else if (orderType === 4) {
      orderStr = ' ORDER BY favorite_count DESC';
    }

    sqlQuery += orderStr + ' LIMIT ?, 26'; // 添加排序和分页限制
    queryParams.push(loadedCount);

    const marketData = await pool.query(sqlQuery, queryParams);
    marketData.map(item => {
      item.ext_option = JSON.parse(JSON.parse(item["ext_option"])["filterData"]);
    });
    const responseData = {
      marketData: marketData
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching market list:", error);
    res.status(500).json({ error: "Server error" });
  }
}

//获取AI项目详情
const marketAppInfo = async (req, res) => {
  try {
    const uploadId = req.query.fId ? parseInt(req.query.fId) : 0;
    if (!uploadId || isNaN(uploadId)) {
      return res.status(400).json({ error: "Invalid parameter" });
    }

    // console.log(isadmin);

    // 构造 SQL 查询语句，使用 LIKE 来匹配相似的插件名称
    let sqlQuery = 'SELECT id,user_id, plugin_name, user_name, install_dir, platforms, description, version, author, like_count,favorite_count, download, project_zip_size, price_type, price_value, need_device, image_path, public_option, oss_path, pan_123_path, plugn_desc, cloud_storage_link, create_time,update_time FROM upload WHERE id = ?';

    // 执行查询
    const marketData = await pool.query(sqlQuery, [uploadId]);

    if(!marketData || marketData.length <= 0){
      return res.status(404).json({ error: "Canot find App!!" });
    }

    // 构造响应对象
    const responseData = marketData[0];
    if(req.user_id){
      //判断是否收藏和点赞
      const checkResult = await pool.query('SELECT id FROM project_favorite_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,responseData["id"],0]);
      if(checkResult.length>0){
        responseData["is_favorite"] = true;
      }else{
        responseData["is_favorite"] = false;
      }

      const checkLikeResult = await pool.query('SELECT id FROM user_like_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,responseData["id"],0]);
      if(checkLikeResult.length>0){
        responseData["is_like"] = true;
      }else{
        responseData["is_like"] = false;
      }
      //获取评论的点赞数据
      const commentlikedate = await pool.query(`select * from comment_likes where user_id = ?`, [req.user_id]);
      let commentlikedates = [];
      commentlikedate.forEach(item => {
        commentlikedates.push(item.comment_id);
      })
      responseData["commentlikedates"] = commentlikedates;
    }

        //获取项目评论数量
    const commentCount = await pool.query('SELECT COUNT(*) as count FROM comment WHERE project_id = ? AND project_type = 0',[responseData["id"]]);
    responseData["comment_count"] = commentCount[0].count;

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
    let isPurchased = false;
    try {
      const userInfo = await userInfoByToken(req.headers['access-token']);
      if(userInfo){
        isPurchased = await checkPurchaseStatus(2, Number(responseData["id"]), userInfo.user_id, userInfo.user_role);
      }
      
    } catch (error) {
      console.error(error);
    }

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

//获取(模型，插件，工作流)详情
const marketResInfo = async (req, res) => {
  try {
    const uploadId = req.query.fId ? parseInt(req.query.fId) : 0;
    if (!uploadId || isNaN(uploadId)) {
      return res.status(400).json({ error: "Invalid parameter" });
    }

    // console.log(isadmin);

    // 构造 SQL 查询语句，使用 LIKE 来匹配相似的插件名称
    let sqlQuery = 'SELECT id,user_id, res_name, user_name, install_dir, platforms, short_desc, version, author, like_count,favorite_count, download, res_zip_size, price_type, price_value, res_type,res_install, image_path, ext_option, oss_path, pan_123_path, res_desc, cloud_storage_link, create_time,update_time FROM upload_resources WHERE id = ?';

    // 执行查询
    const marketData = await pool.query(sqlQuery, [uploadId]);

    if(!marketData || marketData.length <= 0){
      return res.status(404).json({ error: "Canot find App!!" });
    }

    // 构造响应对象
    const responseData = marketData[0];

    if(req.user_id){
      //判断是否收藏和点赞
      const checkResult = await pool.query('SELECT id FROM project_favorite_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,responseData["id"],responseData["res_type"]]);
      if(checkResult.length>0){
        responseData["is_favorite"] = true;
      }else{
        responseData["is_favorite"] = false;
      }

      const checkLikeResult = await pool.query('SELECT id FROM user_like_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,responseData["id"],responseData["res_type"]]);
      if(checkLikeResult.length>0){
        responseData["is_like"] = true;
      }else{
        responseData["is_like"] = false;
      }
      //获取评论的点赞数据
      const commentlikedate = await pool.query(`select * from comment_likes where user_id = ?`, [req.user_id]);
      let commentlikedates = [];
      commentlikedate.forEach(item => {
        commentlikedates.push(item.comment_id);
      })
      responseData["commentlikedates"] = commentlikedates;
    }

    //获取项目评论数量
    const commentCount = await pool.query('SELECT COUNT(*) as count FROM comment WHERE project_id = ? AND project_type > 0',[responseData["id"]]);
    responseData["comment_count"] = commentCount[0].count;


    //获取筛选信息
    const filters = await pool.query('SELECT * FROM upload_resources_filter WHERE upload_id = ?',[responseData["id"]]);

    let arrdata = await filters.reduce((acc, item) => {
        console.log(item)
        if (!acc[item.filter_key]) {
            acc[item.filter_key] = new Set();
        }
        item.filter_value.split(",").forEach(value => acc[item.filter_key].add(value));
        // acc[item.filter_key].add(item.filter_value);
        return acc;
    }, {});
    delete arrdata.device
    // // 将 Set 转换回obj
    let newarr = Object.fromEntries(
        Object.entries(arrdata).map(([key, value]) => [key, Array.from(value)])
    );

    if(responseData["ext_option"]){
      //有提交参数的
      let optionObj = JSON.parse(responseData["ext_option"]);
      let retOptionObj = {};
      if(filters && filters.length > 0){
        retOptionObj["filterData"] = newarr;
      }
      retOptionObj["projectUrl"] = optionObj["projectUrl"];
      responseData["ext_option"] = retOptionObj;
    }

    //判断是否购买，没购买去掉网盘相关信息
    let isPurchased = false;
    try {
      const userInfo = await userInfoByToken(req.headers['access-token']);
      if(userInfo){
        isPurchased = await checkResPurchaseStatus(Number(responseData["res_type"])+2, Number(responseData["id"]), userInfo.user_id, userInfo.user_role);
      }
      
    } catch (error) {
      console.error(error);
    }

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

//下载软件
const download = async (req, res) => {
  const fileId = Number(req.params.fId);

  console.log(fileId);

  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id,user_id,install_dir,download,price_type,plugin_name FROM upload WHERE id = ?', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    //判断下载权限 TODO 这里先屏蔽
    if(result[0].price_type != 1 && false){
      if(result[0].price_type == 2){
        //收费的项目
        const orderData = await pool.query('SELECT id,order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = 2 AND product_id = ?', [req.user_id, fileId]);
        if (orderData.length === 0) {
          return res.status(404).json({ error: 'File not buy' });
        }
      }else if(result[0].price_type == 3){
        //vip会员的项目
        //判断是否VIP
        let isVip = false;
        const userData = await pool.query(
            'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
            [req.user_id]
        );

        if(userData.length > 0){
            isVip = true;
        }

        if(!isVip){
          return res.status(404).json({ error: 'File not vip' });
        }
      }
    }

    const installDir = result[0].install_dir;
    const filePath = `./upload/${result[0].user_id}/${installDir}.zip`;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    // 更新下载次数字段
    const downloadCount = result[0].download + 1;
    await pool.query('UPDATE upload SET download = ? WHERE id = ?', [downloadCount, fileId]);

    //判断用户是否登录
    if(req.user_id){
      // 记录下载记录
      // 在添加前还要判断是否已经存在
      const checkResult = await pool.query('SELECT id FROM user_download_records WHERE user_id = ? AND project_id = ? AND type = 0', [req.user_id, result[0].id]);
      if(checkResult.length > 0){
        //更新下载时间
        await pool.query('UPDATE user_download_records SET updated_at = NOW(), download_count = download_count + 1 WHERE id = ?', [checkResult[0].id]);
      }else{
        //添加下载记录
        await pool.query(
          'INSERT INTO user_download_records (user_id, project_name, type, project_id,download_count) VALUES (?, ?, ?, ?, ?)',
          [req.user_id, result[0].plugin_name, 0, result[0].id,1]
        );
      }
    }

    // 禁用缓存
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Expires', '0');

    // 发送文件给客户端进行下载
    res.download(filePath, `${installDir}.zip`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      } else {
        console.log('File downloaded successfully');
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}

//下载其他资源
const downloadRes = async (req, res) => {
  const fileId = Number(req.params.fId);

  console.log(fileId);

  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id,user_id,install_dir,download,price_type,res_type,res_name FROM upload_resources WHERE id = ?', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    //筛选类型 判断 模型，插件，工作流
    let fileTypePath = '';
    switch(result[0].res_type){
      case 1: //模型
        fileTypePath = 'model';
        break;
      case 2: //插件
        fileTypePath = 'plugin';
        break;
      case 3: //工作流
        fileTypePath = 'workflow';
        break;
    }


    const installDir = result[0].install_dir;
    const filePath = `./upload/${fileTypePath}/${result[0].user_id}/${installDir}.zip`;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    // 更新下载次数字段
    const downloadCount = result[0].download + 1;
    await pool.query('UPDATE upload_resources SET download = ? WHERE id = ?', [downloadCount, fileId]);

    // 记录下载记录
    //判断用户是否登录
    if(req.user_id){
      // 在添加前还要判断是否已经存在
      const checkResult = await pool.query('SELECT id FROM user_download_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id, result[0].id, result[0].res_type]);
      if(checkResult.length > 0){
        //更新下载时间
        await pool.query('UPDATE user_download_records SET updated_at = NOW(), download_count = download_count + 1 WHERE id = ?', [checkResult[0].id]);
      }else{
        //添加下载记录
        await pool.query(
          'INSERT INTO user_download_records (user_id, project_name, type, project_id,download_count) VALUES (?, ?, ?, ?, ?)',
          [req.user_id, result[0].res_name, result[0].res_type, result[0].id,1]
        );
      }
    }

    // 禁用缓存
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Expires', '0');

    // 发送文件给客户端进行下载
    res.download(filePath, `${installDir}.zip`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      } else {
        console.log('File downloaded successfully');
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}


//审核下载脚本
const downloadTemp = async (req, res) => {
  const fileId = Number(req.params.fId);

  console.log(fileId);

  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id,user_id,install_dir,download,price_type FROM upload_tmp WHERE id = ?', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    const installDir = result[0].install_dir;
    const filePath = `./upload_tmp/${result[0].user_id}/${installDir}.zip`;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    // 禁用缓存
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Expires', '0');

    // 发送文件给客户端进行下载
    res.download(filePath, `${installDir}.zip`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      } else {
        console.log('File downloaded successfully');
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}

//审核下载脚本 (模型，插件，工作流)
const downloadResTemp = async (req, res) => {
  const fileId = Number(req.params.fId);

  console.log(fileId);

  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id,user_id,install_dir,download,price_type,res_type FROM upload_resources_tmp WHERE id = ?', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    //筛选类型 判断 模型，插件，工作流
    let fileTypePath = '';
    switch(result[0].res_type){
      case 1: //模型
        fileTypePath = 'model';
        break;
      case 2: //插件
        fileTypePath = 'plugin';
        break;
      case 3: //工作流
        fileTypePath = 'workflow';
        break;
    }

    const installDir = result[0].install_dir;
    const filePath = `./upload_tmp/${fileTypePath}/${result[0].user_id}/${installDir}.zip`;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，则返回错误响应
      return res.status(404).json({ error: 'File not found' });
    }

    // 禁用缓存
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Expires', '0');

    // 发送文件给客户端进行下载
    res.download(filePath, `${installDir}.zip`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      } else {
        console.log('File downloaded successfully');
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}


//授权阿里OSS
const authAliOss = async (req, res) => {

  //判断是否支持oss下载
  const fileId = req.query.fId ? parseInt(req.query.fId) : 0;
  let ossFilePath = "";
  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id, user_id, install_dir, price_type, price_value, oss_path FROM upload WHERE id = ? AND oss_path IS NOT NULL', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      console.error("authAliOss File not found!");
      return res.status(404).json({ error: 'File not found' });
    }

    ossFilePath = result[0].oss_path;
  }catch(e){
    return res.status(500).json({ error: 'Auth alioss error!!' });
  }

  if(ossFilePath == ""){
    console.error("authAliOss filePath empty!");
    //不支持OSS下载的项目
    return res.status(500).json({ error: 'Auth alioss error!!' });
  }

  //获取OSS配置
  let aliossCfg = await readConfig("oss_cfg_ali");
  if(!aliossCfg){
    return res.status(503).json({ error: 'Oss not support!' });
  }

  //判断下载次数
  // 获取当前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  // 检查用户今天是否已经超过了授权次数
  const accessResult = await pool.query(
    'SELECT access_count FROM user_oss_access WHERE user_id = ? AND access_date = ? AND oss_type = 1',
    [req.user_id, currentDate]
  );

  if (accessResult.length > 0 && accessResult[0].access_count >= Number(aliossCfg.dailyLimintDownload)) {
    return res.status(429).json({ error: 'Daily authorization limit exceeded!' });
  }

  // 如果用户还没有达到授权次数限制，则增加一次
  if (accessResult.length > 0) {
    await pool.query(
      'UPDATE user_oss_access SET access_count = access_count + 1 WHERE user_id = ? AND access_date = ? AND oss_type = 1',
      [req.user_id, currentDate]
    );
  } else {
    // 如果是当天第一次授权，则插入一条新记录
    await pool.query(
      'INSERT INTO user_oss_access (oss_type, user_id, user_name, access_date, access_count) VALUES (1, ?, ?, ?, 1)',
      [req.user_id,req.user_name, currentDate]
    );
  }


  //判断是否VIP
  let isVip = false;
  const userData = await pool.query(
      'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
      [req.user_id]
  );

  if(userData.length > 0){
      isVip = true;
  }

  if(!isVip){
    //不是vip判断项目是否购买
    const orderData = await pool.query('SELECT id,order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?', [req.user_id, 2, fileId]);
    if (orderData.length === 0) {
      return res.status(403).json({ error: 'No permission!' });
    }
  }

  const { STS } = require('ali-oss');

  let sts = new STS({
    // 填写步骤1创建的RAM用户AccessKey。
    accessKeyId: aliossCfg.accessKeyId,
    accessKeySecret: aliossCfg.accessKeySecret
  });
    // roleArn填写步骤2获取的角色ARN，例如acs:ram::175708322470****:role/ramtest。
    // policy填写自定义权限策略，用于进一步限制STS临时访问凭证的权限。如果不指定Policy，则返回的STS临时访问凭证默认拥有指定角色的所有权限。
    // 临时访问凭证最后获得的权限是步骤4设置的角色权限和该Policy设置权限的交集。
    // expiration用于设置临时访问凭证有效时间单位为秒，最小值为900，最大值以当前角色设定的最大会话时间为准。本示例指定有效时间为3000秒。
    // sessionName用于自定义角色会话名称，用来区分不同的令牌，例如填写为sessiontest。
    sts.assumeRole(aliossCfg.roleArn, ``, '3000', 'sessionuser' + req.user_id).then((result) => {
      console.log(result);
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-METHOD', 'GET');
      res.json({
        AccessKeyId: result.credentials.AccessKeyId,
        AccessKeySecret: result.credentials.AccessKeySecret,
        SecurityToken: result.credentials.SecurityToken,
        Expiration: result.credentials.Expiration,
        Region: aliossCfg.region,
        Bucket: aliossCfg.bucket,
        FilePath:ossFilePath,
        CustomeDomain: aliossCfg.customeDomain
      });
    }).catch((err) => {
      console.error(err);
      res.json({ msg: 'oss auth error', code: -500 });
    });
}

//授权阿里OSS (模型，插件，工作流)
const authAliOssRes = async (req, res) => {

  //判断是否支持oss下载
  const fileId = req.query.fId ? parseInt(req.query.fId) : 0;
  let ossFilePath = "";
  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id, user_id, install_dir, price_type, price_value, oss_path FROM upload_resources WHERE id = ? AND oss_path IS NOT NULL', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      console.error("authAliOss File not found!");
      return res.status(404).json({ error: 'File not found' });
    }

    ossFilePath = result[0].oss_path;
  }catch(e){
    return res.status(500).json({ error: 'Auth alioss error!!' });
  }

  if(ossFilePath == ""){
    console.error("authAliOss filePath empty!");
    //不支持OSS下载的项目
    return res.status(500).json({ error: 'Auth alioss error!!' });
  }

  //获取OSS配置
  let aliossCfg = await readConfig("oss_cfg_ali");
  if(!aliossCfg){
    return res.status(503).json({ error: 'Oss not support!' });
  }

  //判断下载次数
  // 获取当前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  // 检查用户今天是否已经超过了授权次数
  const accessResult = await pool.query(
    'SELECT access_count FROM user_oss_access WHERE user_id = ? AND access_date = ? AND oss_type = 1',
    [req.user_id, currentDate]
  );

  if (accessResult.length > 0 && accessResult[0].access_count >= Number(aliossCfg.dailyLimintDownload)) {
    return res.status(429).json({ error: 'Daily authorization limit exceeded!' });
  }

  // 如果用户还没有达到授权次数限制，则增加一次
  if (accessResult.length > 0) {
    await pool.query(
      'UPDATE user_oss_access SET access_count = access_count + 1 WHERE user_id = ? AND access_date = ? AND oss_type = 1',
      [req.user_id, currentDate]
    );
  } else {
    // 如果是当天第一次授权，则插入一条新记录
    await pool.query(
      'INSERT INTO user_oss_access (oss_type, user_id, user_name, access_date, access_count) VALUES (1, ?, ?, ?, 1)',
      [req.user_id,req.user_name, currentDate]
    );
  }


  //判断是否VIP
  let isVip = false;
  const userData = await pool.query(
      'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
      [req.user_id]
  );

  if(userData.length > 0){
      isVip = true;
  }

  if(!isVip){
    //不是vip判断项目是否购买
    const orderData = await pool.query('SELECT id,order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?', [req.user_id, 2, fileId]);
    if (orderData.length === 0) {
      return res.status(403).json({ error: 'No permission!' });
    }
  }

  const { STS } = require('ali-oss');

  let sts = new STS({
    // 填写步骤1创建的RAM用户AccessKey。
    accessKeyId: aliossCfg.accessKeyId,
    accessKeySecret: aliossCfg.accessKeySecret
  });
    // roleArn填写步骤2获取的角色ARN，例如acs:ram::175708322470****:role/ramtest。
    // policy填写自定义权限策略，用于进一步限制STS临时访问凭证的权限。如果不指定Policy，则返回的STS临时访问凭证默认拥有指定角色的所有权限。
    // 临时访问凭证最后获得的权限是步骤4设置的角色权限和该Policy设置权限的交集。
    // expiration用于设置临时访问凭证有效时间单位为秒，最小值为900，最大值以当前角色设定的最大会话时间为准。本示例指定有效时间为3000秒。
    // sessionName用于自定义角色会话名称，用来区分不同的令牌，例如填写为sessiontest。
    sts.assumeRole(aliossCfg.roleArn, ``, '3000', 'sessionuser' + req.user_id).then((result) => {
      console.log(result);
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-METHOD', 'GET');
      res.json({
        AccessKeyId: result.credentials.AccessKeyId,
        AccessKeySecret: result.credentials.AccessKeySecret,
        SecurityToken: result.credentials.SecurityToken,
        Expiration: result.credentials.Expiration,
        Region: aliossCfg.region,
        Bucket: aliossCfg.bucket,
        FilePath:ossFilePath,
        CustomeDomain: aliossCfg.customeDomain
      });
    }).catch((err) => {
      console.error(err);
      res.json({ msg: 'oss auth error', code: -500 });
    });
}
//授权123网盘下载 更新新版本
const authOneTowThereePanUpdate = async (req, res) => {
  const {packageType} = req.query;
  try{
    // 非强制更新版本信息
    let update = await readConfig("app_info_cfg_update");
    if(update){
      let urllink = ''
      // 根据packageType参数决定下载链接和文件名
      switch(packageType){
        case "dmg":
          urllink = update.urllinkmac;
          break;
        case "arm":
          urllink = update.urllinkmacarm;
          break;
        case "rpm":
          urllink = update.urllinklinux;
          break;
        case "deb":
          urllink = update.urllinklinuxdeb;
          break;
        case "appimage":
          urllink = update.urllinklinuxapp;
          break;
        default:
          // 默认为Windows
          urllink = update.urllinkwin;
          break;
      }
      const validDuration = 15 * 60 * 1000; // 链接签名有效期，单位：毫秒
      const downloadUrl = await oneTwoThreePanSignURL(urllink, "A1B2C3D4E5F6G7H8", 1819142310, validDuration)
      return res.status(200).json({url: downloadUrl });
    }
    return res.status(404).json({ error: 'No update available' });
  }catch(e){
    console.log(e);
    return res.status(500).json({ error: 'authOneTowThereePan error' });
  }
}

//授权123网盘下载
const authOneTowThereePan = async (req, res) => {

  //判断是否支持123网盘下载
  const fileId = req.query.fId ? parseInt(req.query.fId) : 0;
  let panFilePath = "";
  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id, user_id, install_dir, price_type, price_value, pan_123_path FROM upload WHERE id = ? AND pan_123_path IS NOT NULL', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      console.error("123pan File not found!");
      return res.status(404).json({ error: 'File not found' });
    }

    panFilePath = result[0].pan_123_path;
  }catch(e){
    return res.status(500).json({ error: 'Auth error!!' });
  }

  if(panFilePath == ""){
    console.error("123Pan filePath empty!");
    //不支持OSS下载的项目
    return res.status(500).json({ error: 'Auth error!!' });
  }

  let dailyLimintDownload = 5; //写死下载限制5次

  //判断下载次数
  // 获取当前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  // 检查用户今天是否已经超过了授权次数
  const accessResult = await pool.query(
    'SELECT access_count FROM user_oss_access WHERE user_id = ? AND access_date = ? AND oss_type = 2',
    [req.user_id, currentDate]
  );

  if (accessResult.length > 0 && accessResult[0].access_count >= Number(dailyLimintDownload)) {
    return res.status(429).json({ error: 'Daily authorization limit exceeded!' });
  }

  // 如果用户还没有达到授权次数限制，则增加一次
  if (accessResult.length > 0) {
    await pool.query(
      'UPDATE user_oss_access SET access_count = access_count + 1 WHERE user_id = ? AND access_date = ? AND oss_type = 2',
      [req.user_id, currentDate]
    );
  } else {
    // 如果是当天第一次授权，则插入一条新记录
    await pool.query(
      'INSERT INTO user_oss_access (oss_type, user_id, user_name, access_date, access_count) VALUES (2, ?, ?, ?, 1)',
      [req.user_id,req.user_name, currentDate]
    );
  }

  //判断是否VIP
  let isVip = false;
  const userData = await pool.query(
      'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
      [req.user_id]
  );

  if(userData.length > 0){
      isVip = true;
  }

  if(!isVip){
    //不是vip判断项目是否购买
    const orderData = await pool.query('SELECT id,order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?', [req.user_id, 2, fileId]);
    if (orderData.length === 0) {
      return res.status(403).json({ error: 'No permission!' });
    }
  }

  const validDuration = 15 * 60 * 1000; // 链接签名有效期，单位：毫秒

  const downloadUrl = await oneTwoThreePanSignURL(panFilePath, "A1B2C3D4E5F6G7H8", 1819142310, validDuration)

  console.log("123pan url:" + downloadUrl + "  -> " + panFilePath);

  return res.status(200).json({ url: downloadUrl });
}

//授权123网盘下载 (模型，插件，工作流)
const authOneTowThereePanRes = async (req, res) => {

  //判断是否支持123网盘下载
  const fileId = req.query.fId ? parseInt(req.query.fId) : 0;
  let panFilePath = "";
  try {
    // 根据 fileId 查询数据库中的文件路径
    const result = await pool.query('SELECT id, user_id, install_dir, price_type, price_value, pan_123_path FROM upload_resources WHERE id = ? AND pan_123_path IS NOT NULL', [fileId]);
    if (result.length === 0) {
      // 如果数据库中没有匹配的文件记录，则返回错误响应
      console.error("123pan File not found!");
      return res.status(404).json({ error: 'File not found' });
    }

    panFilePath = result[0].pan_123_path;
  }catch(e){
    return res.status(500).json({ error: 'Auth error!!' });
  }

  if(panFilePath == ""){
    console.error("123Pan filePath empty!");
    //不支持OSS下载的项目
    return res.status(500).json({ error: 'Auth error!!' });
  }

  let dailyLimintDownload = 5; //写死下载限制5次

  //判断下载次数
  // 获取当前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  // 检查用户今天是否已经超过了授权次数
  const accessResult = await pool.query(
    'SELECT access_count FROM user_oss_access WHERE user_id = ? AND access_date = ? AND oss_type = 2',
    [req.user_id, currentDate]
  );

  if (accessResult.length > 0 && accessResult[0].access_count >= Number(dailyLimintDownload)) {
    return res.status(429).json({ error: 'Daily authorization limit exceeded!' });
  }

  // 如果用户还没有达到授权次数限制，则增加一次
  if (accessResult.length > 0) {
    await pool.query(
      'UPDATE user_oss_access SET access_count = access_count + 1 WHERE user_id = ? AND access_date = ? AND oss_type = 2',
      [req.user_id, currentDate]
    );
  } else {
    // 如果是当天第一次授权，则插入一条新记录
    await pool.query(
      'INSERT INTO user_oss_access (oss_type, user_id, user_name, access_date, access_count) VALUES (2, ?, ?, ?, 1)',
      [req.user_id,req.user_name, currentDate]
    );
  }

  //判断是否VIP
  let isVip = false;
  const userData = await pool.query(
      'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
      [req.user_id]
  );

  if(userData.length > 0){
      isVip = true;
  }

  if(!isVip){
    //不是vip判断项目是否购买
    const orderData = await pool.query('SELECT id,order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?', [req.user_id, 2, fileId]);
    if (orderData.length === 0) {
      return res.status(403).json({ error: 'No permission!' });
    }
  }

  const validDuration = 15 * 60 * 1000; // 链接签名有效期，单位：毫秒

  const downloadUrl = await oneTwoThreePanSignURL(panFilePath, "A1B2C3D4E5F6G7H8", 1819142310, validDuration)

  console.log("123pan url:" + downloadUrl + "  -> " + panFilePath);

  return res.status(200).json({ url: downloadUrl });
}

//临时更新标签sql
const updateTagSql = async (req, res) => {
  const rows = await pool.query(`SELECT * FROM upload`);

  // 使用Promise.all来等待所有插入操作完成
  await Promise.all(rows.map(async element => {
    //显卡判断
    if (element["plugin_name"].includes("A卡")) {
      let data = {
        upload_id: element["id"], // 确保这是正确的键名
        filter_key: "device",
        filter_value: "amd"
      };
      try {
        await pool.query('INSERT INTO upload_filter SET ?', data);

        await pool.query('UPDATE upload SET need_device = ? WHERE id = ?', ["3", element["id"]]);
      } catch (error) {
        console.error(`Error inserting data for ${element["id"]}:`, error);
      }
    }else{
      if(element["public_option"]){
        //有提交参数的
        let optionObj = JSON.parse(element["public_option"]);
        if(optionObj["gupRadio"].includes("1")){
          //cpu
          try {
            await pool.query('INSERT INTO upload_filter SET ?', {
              upload_id: element["id"], // 确保这是正确的键名
              filter_key: "device",
              filter_value: "cpu"
            });
          } catch (error) {
            console.error(`Error inserting data for ${element["id"]}:`, error);
          }
        }
        
        if(optionObj["gupRadio"].includes("2")){
          //n卡
          try {
            await pool.query('INSERT INTO upload_filter SET ?', {
              upload_id: element["id"], // 确保这是正确的键名
              filter_key: "device",
              filter_value: "nvidia"
            });
          } catch (error) {
            console.error(`Error inserting data for ${element["id"]}:`, error);
          }
        }

        if(optionObj["gupRadio"].includes("3")){
          //a卡
          try {
            await pool.query('INSERT INTO upload_filter SET ?', {
              upload_id: element["id"], // 确保这是正确的键名
              filter_key: "device",
              filter_value: "amd"
            });
          } catch (error) {
            console.error(`Error inserting data for ${element["id"]}:`, error);
          }
        }

        if(optionObj["gupRadio"].length > 0){
          await pool.query('UPDATE upload SET need_device = ? WHERE id = ?', [optionObj["gupRadio"].join(','), element["id"]]);
        }

        //图片处理
        if(optionObj["imagePath"] && optionObj["imagePath"] != ""){
          let tmpImagePath = element["user_id"] + '/' + element["install_dir"] + ".png";
          await pool.query('UPDATE upload SET image_path = ? WHERE id = ?', [tmpImagePath, element["id"]]);
        }

      }else{
        let data = {
          upload_id: element["id"], // 确保这是正确的键名
          filter_key: "device",
          filter_value: "nvidia"
        };
        try {
          await pool.query('INSERT INTO upload_filter SET ?', data);

          await pool.query('UPDATE upload SET need_device = ? WHERE id = ?', ["2", element["id"]]);

        } catch (error) {
          console.error(`Error inserting data for ${element["id"]}:`, error);
        }
      }
    }

    //处理AI应用分类
    let tmpTitle = element["plugin_name"].toLowerCase();

    if(tmpTitle.includes("comfy") || tmpTitle.includes("draggan") || tmpTitle.includes("diffusion") || tmpTitle.includes("forge")
    || tmpTitle.includes("fooocus") || tmpTitle.includes("codeformer")
    ){
      //图像
      let data = {
        upload_id: element["id"], // 确保这是正确的键名
        filter_key: "class",
        filter_value: "image"
      };
      try {
        await pool.query('INSERT INTO upload_filter SET ?', data);
      } catch (error) {
        console.error(`Error inserting data for ${element["id"]}:`, error);
      }
    }else if(tmpTitle.includes("sovits") || tmpTitle.includes("chattts")){
      //声音
      let data = {
        upload_id: element["id"], // 确保这是正确的键名
        filter_key: "class",
        filter_value: "sound"
      };
      try {
        await pool.query('INSERT INTO upload_filter SET ?', data);
      } catch (error) {
        console.error(`Error inserting data for ${element["id"]}:`, error);
      }
    }else if(tmpTitle.includes("sadtalker") || tmpTitle.includes("wav2lip") || tmpTitle.includes("rope") || tmpTitle.includes("rope")){
      //视频
      let data = {
        upload_id: element["id"], // 确保这是正确的键名
        filter_key: "class",
        filter_value: "video"
      };
      try {
        await pool.query('INSERT INTO upload_filter SET ?', data);
      } catch (error) {
        console.error(`Error inserting data for ${element["id"]}:`, error);
      }
    }else if(tmpTitle.includes("chatglm") || tmpTitle.includes("gpt academic") || tmpTitle.includes("visualgml") || tmpTitle.includes("ollama")){
      //文本
      let data = {
        upload_id: element["id"], // 确保这是正确的键名
        filter_key: "class",
        filter_value: "text"
      };
      try {
        await pool.query('INSERT INTO upload_filter SET ?', data);
      } catch (error) {
        console.error(`Error inserting data for ${element["id"]}:`, error);
      }
    }

  }));

  return res.json({ok:true})
}

//前端个人中心初始用户信息
const getUserInfo = async (req, res) => {
  try{
    let data={};//前端需要的数据
    //获取用户信息
    const userData = await pool.query('SELECT * FROM users WHERE id = ?', [req.user_id]);
    if(userData.length > 0){
      data.username = userData[0].username;
      data.email = userData[0].email;
    }
    // 获取用户项目下载量和点赞量以及收藏量
    const projectStatsResult = await pool.query('SELECT SUM(download) AS total_downloads, SUM(like_count) AS total_likes,SUM(favorite_count) AS total_favorite FROM upload WHERE user_id = ?', [req.user_id]);
    // 获取用户资源下载量和点赞量以及收藏量
    const resourceStatsResult = await pool.query('SELECT SUM(download) AS total_resource_downloads, SUM(like_count) AS total_resource_likes,SUM(favorite_count) AS total_resource_favorite FROM upload_resources WHERE user_id = ?', [req.user_id]);
    //获取用户邀请码邀请人数
    const inviteCodeResult = await pool.query('SELECT COUNT(*) AS total_invite FROM users WHERE parent_invite_code = ?', [userData[0].invite_code]);
    if(inviteCodeResult.length > 0){
      data.invite = inviteCodeResult[0].total_invite;
    }
    // 获取总下载量和点赞量以及收藏量
    data.downloads = (projectStatsResult[0].total_downloads || 0) + (resourceStatsResult[0].total_resource_downloads || 0);
    data.likes = (projectStatsResult[0].total_likes || 0) + (resourceStatsResult[0].total_resource_likes || 0);
    data.favorites = (projectStatsResult[0].total_favorite || 0) + (resourceStatsResult[0].total_resource_favorite || 0);

    //获取用户收益
    const incomeResult = await pool.query(
      `SELECT SUM(amount) AS total_income FROM pay_order WHERE status IN (1,4,7) AND merchant_id = ?`,
      [req.user_id]
    );
    data.income = (incomeResult[0].total_income/100).toFixed(2) || 0.00;
    //获取用户详细信息
    const Result = await pool.query('SELECT * FROM users_info WHERE user_id = ?', [req.user_id]);
    if(Result.length > 0){
      data.balance = (Result[0].balance/100).toFixed(2) || 0.00;
      data.avatar_url = Result[0].avatar_url;
      data.InfoState = Result[0].state;
      data.bio = Result[0].bio;
      data.alias = Result[0].alias;
    }else{
      //创建用户详细信息
      await pool.query('INSERT INTO users_info SET?', {
        user_id: req.user_id,
      });
      data.balance = 0.00;
      data.avatar_url = '';
    }


    return res.json({msg: 'success',data:data,code:200});
    
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 获取个人信息
const getPersonalInfo = async (req, res) => {
  try{
    let data={};//前端需要的数据
    //获取用户信息
    const userData = await pool.query('SELECT * FROM users_info WHERE user_id =?', [req.user_id]);
    data.email = req.user_email;
    data.phone = req.phone;
    if(userData.length > 0){
      data.alias = userData[0].alias;
      data.avatar_url = userData[0].avatar_url;
      data.sex = userData[0].gender;
      data.bio = userData[0].bio;
    }else{
      //创建用户详细信息
      await pool.query('INSERT INTO users_info SET?', {
        user_id: req.user_id,
      });
      data.alias = ''
      data.avatar_url = ''
      data.sex = ''
      data.bio = ''
    }
    return res.json({msg: 'success',data:data,code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 更新个人信息
const updatePersonalInfo = async (req, res) => {
  try{
    const {alias,gender,bio,phone} = req.body;
    //判断简介字符规则不能有特殊字符
    // 只检测SQL注入常见字符
    let reg = /['";\\#%]/im;
    if(reg.test(bio)){
      return res.status(400).json({ error: 'Bio contains illegal characters. Please check and try again!' });
    }
    //判断手机号格式
    if(phone && phone.length > 0){
      let reg = /^\+?\d{6,20}$/;
      if(!reg.test(phone)){
        return res.status(400).json({ error: 'Phone number format is incorrect!' });
      }
    }
    //判断用户名格式
    if(alias && alias.length > 0){
      let reg = /^[\u4e00-\u9fa5a-zA-Z0-9_-]{2,20}$/;
      if(!reg.test(alias)){
        return res.status(400).json({ error: 'Username format is incorrect!' });
      }
    }
    // console.log(req.files.image)
    let userDir = './userinfo/' + req.user_id + "/";
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
    //更新用户头像
    //上传图片到某个位置
    if(req.files && req.files.image){
      let imagePath = userDir + 'avatar.png';
      let imageObj = req.files.image;
      imageObj.mv(imagePath, async (err) => {
        if(err){
          console.error("Update load image error:" + imagePath);
        }
      });
    }
    let tmpImagePath = req.user_id + '/' + "avatar.png";
    //更新用户信息
    const userData = await pool.query('UPDATE users_info SET alias = ?, gender = ?, bio = ?, avatar_url = ? WHERE user_id = ?', [alias,gender,bio,tmpImagePath,req.user_id]);
    if(userData.affectedRows == 0){
      return res.json({msg: 'fail',code:-1});
    }
    //更新用户手机号
    const phoneData = await pool.query('UPDATE users SET phone =? WHERE id =?', [phone,req.user_id]);
    if(phoneData.affectedRows == 0){
      return res.json({msg: 'fail',code:-1});
    }
    return res.json({msg:'success',code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 获取个人信息 详细信息
const getPersonalInfoDetail = async (req, res) => {
  try{
    let data={};//前端需要的数据
    //获取用户信息
    const userData = await pool.query('SELECT * FROM users_info WHERE user_id =?', [req.user_id]);
    if(userData.length > 0){
      data.name = userData[0].name;
      data.id_card_number = userData[0].id_card_number;
      data.id_card_expiry_date = userData[0].id_card_expiry_date?formatDateTimeSync(userData[0].id_card_expiry_date):'';
      data.id_card_front_image_url = userData[0].id_card_front_image_url;
      data.id_card_back_image_url = userData[0].id_card_back_image_url;
      data.address = userData[0].address;
      data.wechat_image_url = userData[0].wechat_image_url;
      data.bank_account_number = userData[0].bank_account_number;
      data.bank_name = userData[0].bank_name;
      data.alipay_image_url = userData[0].alipay_image_url;
      data.paypal_id = userData[0].paypal_id;
      data.state = userData[0].state;
    }else{
      //创建用户详细信息
      await pool.query('INSERT INTO users_info SET?', {
        user_id: req.user_id,
      });
      data.name = ''
      data.id_card_number = ''
      data.id_card_expiry_date = ''
      data.id_card_front_image_url = ''
      data.id_card_back_image_url = ''
      data.address = ''
      data.wechat_image_url = ''
      data.bank_account_number = ''
      data.bank_name = ''
      data.alipay_image_url = ''
      data.paypal_id = ''
      data.state = 0;
    }
    return res.json({msg: 'success',data:data,code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 获取个人信息 详细信息 修改
const updatePersonalInfoDetail = async (req, res) => {
  try{
    const {name,id_card_number,id_card_expiry_date,address,paypal_id,bank_account_number,bank_name} = req.body;

    // 先获取用户现有的图片信息
    const existingUserData = await pool.query('SELECT id_card_front_image_url, id_card_back_image_url, wechat_image_url, alipay_image_url FROM users_info WHERE user_id = ?', [req.user_id]);
    let IdcardFrontImage = existingUserData.length > 0 ? (existingUserData[0].id_card_front_image_url || '') : '';
    let IdcardBackImage = existingUserData.length > 0 ? (existingUserData[0].id_card_back_image_url || '') : '';
    let WechatImage = existingUserData.length > 0 ? (existingUserData[0].wechat_image_url || '') : '';
    let AlipayImage = existingUserData.length > 0 ? (existingUserData[0].alipay_image_url || '') : '';

    let userDir = './userinfo/' + req.user_id + "/";
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
    //上传身份证正面
    if (req.files && req.files.idcard_front_image) {
      let imagefront = userDir + 'IdcardFrontImage.png';
      let imageObjFront = req.files.idcard_front_image;
      imageObjFront.mv(imagefront, async (err) => {
        if(err){
          console.error("Update load image error:" + imagefront);
        }
      });
      IdcardFrontImage = req.user_id + '/' + "IdcardFrontImage.png";
    }
    //上传身份证反面
    if (req.files && req.files.idcard_back_image) {
      let imageback = userDir + 'IdcardBackImage.png';
      let imageObjBack = req.files.idcard_back_image;
      imageObjBack.mv(imageback, async (err) => {
        if(err){
          console.error("Update load image error:" + imageback);
        }
      });
      IdcardBackImage = req.user_id + '/' + "IdcardBackImage.png";
    }
    //上传微信收款码
    if (req.files && req.files.wechat_image_url) {
      const image = userDir + 'WechatImage.png';
      const imageObj = req.files.wechat_image_url;
      imageObj.mv(image, async (err) => {
        if(err){
          console.error("Update load image error:" + image);
        }
      });
      WechatImage = req.user_id + '/' + "WechatImage.png";
    }
    //上传支付宝收款码
    if (req.files && req.files.alipay_image_url) {
      const image = userDir + 'AlipayImage.png';
      const imageObj = req.files.alipay_image_url;
      imageObj.mv(image, async (err) => {
        if(err){
          console.error("Update load image error:" + image);
        }
      });
      AlipayImage = req.user_id + '/' + "AlipayImage.png";
    }
    //更新用户信息
    const userData = await pool.query('UPDATE users_info SET name = ?, id_card_number = ?, id_card_expiry_date = ?,id_card_front_image_url = ?, id_card_back_image_url = ?, address = ?, wechat_image_url = ?,alipay_image_url = ?,paypal_id = ?,bank_account_number = ?,bank_name = ?,state = 1,update_time=NOW() WHERE user_id = ?', [name,id_card_number,id_card_expiry_date,IdcardFrontImage,IdcardBackImage,address,WechatImage,AlipayImage,paypal_id,bank_account_number,bank_name,req.user_id]);
    if(userData.affectedRows == 0){
      return res.json({msg: 'fail',code:-1});
    }
    return res.json({msg: 'success',code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 获取个人信息 详细信息 验证密码
const checkPersonalInfoPassword = async (req, res) => {
  const { password } = req.body;
  try {
    // 参数验证
    if (!password) {
      return res.json({ msg: '密码不能为空', code: 400 });
    }
    
    // 查询用户密码
    const userResult = await pool.query('SELECT password FROM users WHERE id = ?', [req.user_id]);
    if (userResult.length === 0) {
      return res.json({ msg: '用户不存在', code: 400 });
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, userResult[0].password);
    if (!isPasswordValid) {
      return res.json({ msg: '密码错误', code: 400 });
    }
    
    return res.json({ msg: 'success', code: 200 });
    
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 收益中心
const getIncomeInfo = async (req, res) => {
  const {startTime, endTime} = req.body;
  // 请求频繁判断（以用户ID为例，每10秒只能请求一次）
  // const methodKey = `${req.user_id}:getIncomeInfo`;
  // const now = Date.now();
  // const lastReq = requestLimitMap.get(methodKey) || 0;
  // if(now - lastReq < 10000){
  //   return res.json({msg:'请求过于频繁，请稍后再试',code:-1});
  // }
  // requestLimitMap.set(methodKey, now);
  try{
    let data={};//前端需要的数据
    const yesterdayIncomeResult = await pool.query(
      `SELECT SUM(amount) AS total_income FROM pay_order WHERE status IN (1,4,7) AND refund_status = 0 AND merchant_id=? AND DATE_FORMAT(create_time, "%Y-%m-%d") = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), "%Y-%m-%d")`,
      [req.user_id]
    );
    data.yesterdayIncome = (yesterdayIncomeResult[0].total_income/100).toFixed(2) || 0.00;
    //获取用户近30天收益
    const thirtyDaysIncomeResult = await pool.query(
      `SELECT SUM(amount) AS total_income FROM pay_order WHERE status IN (1,4,7) AND refund_status = 0 AND merchant_id=? AND DATE_FORMAT(create_time, "%Y-%m-%d") >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), "%Y-%m-%d")`,
      [req.user_id]
    );
    data.thirtyDaysIncome = (thirtyDaysIncomeResult[0].total_income/100).toFixed(2) || 0.00;;
    //获取用户近3个月收益
    const threeMonthsIncomeResult = await pool.query(
      `SELECT SUM(amount) AS total_income FROM pay_order WHERE status IN (1,4,7) AND refund_status = 0 AND merchant_id=? AND DATE_FORMAT(create_time, "%Y-%m") >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 MONTH), "%Y-%m")`,

      [req.user_id]
    );
    data.threeMonthsIncome = (threeMonthsIncomeResult[0].total_income/100).toFixed(2) || 0.00;
    //获取用户自定义时间段收益
    const dailyIncomeResult = await pool.query(`
      SELECT
        DATE_FORMAT(create_time, '%Y-%m-%d') AS date,
        SUM(CASE WHEN status = 1 THEN amount ELSE 0 END) AS creation_income,
        SUM(CASE WHEN status IN (4,7) THEN amount ELSE 0 END) AS reward_amount,
        SUM(CASE WHEN status IN (1,4,7) THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN refund_status = 2 AND status != 6 THEN amount ELSE 0 END) AS total_refund,
        description
      FROM pay_order
      WHERE merchant_id=? AND DATE(create_time) BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(create_time, '%Y-%m-%d')
      HAVING total_income > 0 OR total_refund > 0
      ORDER BY date ASC
    `, [req.user_id, startTime, endTime]);
    data.dailyIncome = dailyIncomeResult.map(item => ({
      time: item.date,
      total: (item.total_income/100).toFixed(2) || 0.00,
      refund: (item.total_refund/100).toFixed(2) || 0.00,
      creation_income: (item.creation_income/100).toFixed(2) || 0.00,
      reward_amount: (item.reward_amount/100).toFixed(2) || 0.00,
      order_desc: item.description
    }));

    return res.json({msg:'success',data:data,code:200});
    
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 钱包中心
const getWalletInfo = async (req, res) => {
  const {startTime, endTime} = req.body;
  try{
    let data={};//前端需要的数据
    //获取用户钱包信息
    const walletData = await pool.query('SELECT * FROM users_info WHERE user_id =?', [req.user_id]);
    if(walletData.length>0){
      data.wallet = (walletData[0].balance/100).toFixed(2) || 0.00;//用户余额
    }else if(walletData.length==0){//没有钱包信息
      //创建钱包
      await pool.query('INSERT INTO users_info SET?', {
        user_id: req.user_id, // 确保这是正确的键名
      });
      data.wallet = 0.00;//用户余额
    }
    //获取收益信息
    data.under_review = 0.00;
    const totalIncome = await pool.query('SELECT * FROM user_monthly_income_audit WHERE user_id = ? AND audit_status = 0', [req.user_id]); //获取未审核的收益
    if(totalIncome.length>0){
      let totalIncomeAmount = 0;
      for(const item of totalIncome){
        totalIncomeAmount += Number(item.income_amount)||0;
      }
      data.under_review = (totalIncomeAmount/100).toFixed(2) || 0.00;//待入账
    }

    //获取提现账单
    let withdrawListdaily = [];
    const withdrawList = await pool.query(`SELECT * FROM withdraw_order WHERE user_id = ? AND DATE(create_time) BETWEEN ? AND ? ORDER BY id DESC`, [req.user_id,startTime, endTime]);
    withdrawListdaily = withdrawList.map(item=>({
      time:formatDateTimeSync(item.create_time),
      transferid:item.withdraw_no,
      status:item.status,
      transferbalance:(item.amount/100).toFixed(2) || 0.00,
      tax_amount:(item.incometax_amount/100).toFixed(2) || 0.00,
      remark:item.remark,
      channel:item.method,
    }))
    data.withdrawList = withdrawListdaily;

    return res.json({msg:'success',data:data,code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 优惠中心
const getDiscountInfo = async (req, res) => { 
  const { startTime, endTime } = req.body;
  try{
    let data = {};
    data.coupon_used_count = 0; //已消耗的优惠码数量
    data.coupon_count = 0; //未使用的优惠码数量
    //获取用户已消耗的优惠码
    const userData = await pool.query('SELECT coupon_used_count FROM users_info WHERE user_id =?', [req.user_id]);
    if(userData.length>0){
      data.coupon_used_count = userData[0].coupon_used_count;
    }else{
      //创建用户详细信息
      await pool.query('INSERT INTO users_info SET?', {
        user_id: req.user_id,
      });
    }
    //获取未使用的优惠码
    const coupon = await pool.query('SELECT COUNT(*) as total FROM coupon WHERE applicant_id =? AND used = 0 AND valid_to > NOW() AND valid_from < NOW()', [req.user_id]);
    if(coupon.length>0){
      data.coupon_count = coupon[0].total;
    }
    //获取优惠码列表
    let couponList = [];
    const couponData = await pool.query('SELECT * FROM coupon WHERE applicant_id =?', [req.user_id]);
    if(couponData.length>0){
      couponList = couponData.map(item=>({
        id:item.id,
        code:item.code,
        // discount_type:item.discount_type,
        // discount_value:item.discount_value,
        min_amount:item.min_amount,
        cashback_amount:item.cashback_amount,
        valid_from:formatDate(item.valid_from),
        valid_to:formatDate(item.valid_to),
        used:item.used,
        user_name:item.user_name,
      }))
    }
    data.couponList = couponList;
    return res.json({msg:'success',data:data,code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 获取优惠申请列表
const getDiscountApplyList = async (req, res) => {
  const { startTime, endTime } = req.body;
  try {
    let data = {};
    let couponList = [];
    data.coupon_apply_count = 0; //用户申请中的优惠码数量
    //获取用户申请中的优惠码列表
    const couponData = await pool.query('SELECT SUM(apply_count) as total FROM coupon_apply WHERE applicant_id =? AND status = 0', [req.user_id]);
    if(couponData.length>0){
      data.coupon_apply_count = couponData[0].total;
    }
    //获取优惠申请列表
    const couponApplyData = await pool.query('SELECT * FROM coupon_apply WHERE applicant_id =? AND DATE(created_at) BETWEEN ? AND ?', [req.user_id, startTime, endTime]);
    if(couponApplyData.length>0){
      couponList = couponApplyData.map(item=>({
        applicant_name:item.applicant_name,
        apply_count:item.apply_count,
        issued_count:item.issued_count,
        status:item.status,
        review_remark:item.review_remark,
        reviewer_name:item.reviewer_name,
        reviewed_at:item.reviewed_at?formatDate(item.reviewed_at):'',
        created_at:formatDate(item.created_at),
      }))
    }
    data.couponList = couponList;
    return res.json({msg:'success',data:data,code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 优惠申请
const discountApply = async (req, res) => {
  const {num} = req.body;
  try{
    if(num<1){
      return res.json({msg:'请输入正确的申请数量',code:400});
    }
    let data = {
      applicant_id:req.user_id,
      applicant_name:req.user_name,
      apply_count:num,
      issued_count:num,
    }
    const result = await pool.query('INSERT INTO coupon_apply SET?', data);
    if(result.affectedRows==0){
      return res.json({msg:'申请失败',code:400});
    }
    return res.json({msg:'success',code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 邀请码信息列表
const getInviteInfo = async (req, res) => {
  const { starttime, endtime } = req.body;
  try{
    let data = {}
    data.my_invite_code = '';
    data.parent_invite_code = '';
    data.invite_count = 0;
    data.invite_income = 0;
    //获取用户邀请码
    const inviteCode = await pool.query("SELECT invite_code FROM users WHERE id = ?", [req.user_id]);
    if(inviteCode.length>0){
      data.my_invite_code = inviteCode[0].invite_code;
      //获取用户邀请码子用户数量
      const inviteCount = await pool.query("SELECT COUNT(*) AS inviteCount FROM users WHERE parent_invite_code = ?", [inviteCode[0].invite_code]);
      if(inviteCount.length>0){
        data.invite_count = inviteCount[0].inviteCount; //邀请码子用户数量
      }
    }
    //获取用户上级邀请码
    const parentInviteCode = await pool.query("SELECT parent_invite_code FROM users WHERE id = ?", [req.user_id]);
    if(parentInviteCode.length>0){
      data.parent_invite_code = parentInviteCode[0].parent_invite_code;
    }
    //获取用户通过邀请码获取的总收益
    const inviteIncome = await pool.query(`SELECT SUM(amount) AS totalAmount FROM pay_order WHERE status = 7 AND merchant_id = ?`, [req.user_id]);
    if(inviteIncome.length>0){
      data.invite_income = (inviteIncome[0].totalAmount/100).toFixed(2) || 0.00; //邀请码收益
    }
    //获取用户自定义时间段收益
    const dailyIncomeResult = await pool.query(`
      SELECT
        DATE_FORMAT(create_time, '%Y-%m-%d') AS date,
        SUM(CASE WHEN status = 7 THEN amount ELSE 0 END) AS total_income,
        COUNT(CASE WHEN status = 7 THEN 1 END) AS order_count
      FROM pay_order
      WHERE merchant_id=? AND DATE(create_time) BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(create_time, '%Y-%m-%d')
      HAVING total_income > 0
      ORDER BY date ASC
    `, [req.user_id, starttime, endtime]);
    data.list = dailyIncomeResult.map(item => ({
      time: item.date,
      total: (item.total_income/100).toFixed(2) || 0.00,
      usertotal: item.order_count || 0
    }));
    return res.json({msg:'success',data:data,code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 邀请码生成
const setInviteCode = async (req, res) => {
  try{
    //获取用户邀请码
    const inviteCodeResult = await pool.query('SELECT invite_code FROM users WHERE id=?', [req.user_id]);
    if(inviteCodeResult.length > 0){ 
      if(inviteCodeResult[0].invite_code){ 
        return res.json({msg:'您已经生成了邀请码，无需重复生成',code:400});
      }
    }else{
      return res.json({msg:'用户不存在',code:400});
    }
    
    let attempts = 0;
    const maxAttempts = 10; // 最大重试次数
    
    while (attempts < maxAttempts) {
      try {
        const newInviteCode = generateInviteCode();
        
        // 检查邀请码是否已存在
        const existingCode = await pool.query('SELECT id FROM users WHERE invite_code = ?', [newInviteCode]);
        if (existingCode.length > 0) {
          attempts++;
          continue; // 邀请码已存在，重新生成
        }
        
        // 尝试更新用户邀请码
        let result = await pool.query('UPDATE users SET invite_code=? WHERE id=?', [newInviteCode, req.user_id]);
        if(result.affectedRows > 0){ //更新成功
          return res.json({msg:'success',code:200,data:{inviteCode: newInviteCode}});
        } else {
          attempts++;
        }
      } catch (updateError) {
        console.error('邀请码更新错误:', updateError);
        attempts++;
      }
    }
    
    // 重试次数用完，返回失败
    return res.json({msg:'生成邀请码失败，请稍后重试',code:400});
    
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心，用户邀请码自定义生成
const setInviteCodeCustom = async (req, res) => {
  const {inviteCode} = req.body;
  try{
    // 参数验证
    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.json({msg:'请输入有效的邀请码',code:400});
    }
    
    // 邀请码格式验证：6-20位字母数字组合
    const inviteCodeRegex = /^[a-zA-Z0-9]{6,20}$/;
    if (!inviteCodeRegex.test(inviteCode)) {
      return res.json({msg:'邀请码格式不正确，请输入6-20位字母数字组合',code:400});
    }
    
    // 检查用户是否存在
    const userResult = await pool.query('SELECT invite_code FROM users WHERE id=?', [req.user_id]);
    if(userResult.length === 0){
      return res.json({msg:'用户不存在',code:400});
    }
    
    // 检查用户是否已经有邀请码
    if(userResult[0].invite_code){ 
      return res.json({msg:'您已经生成了邀请码，无法重新设置',code:400});
    }
    
    // 检查邀请码是否已被使用
    const existingCode = await pool.query('SELECT id FROM users WHERE invite_code = ?', [inviteCode]);
    if (existingCode.length > 0) {
      return res.json({msg:'该邀请码已被使用，请选择其他邀请码',code:400});
    }
    
    // 更新用户邀请码
    const result = await pool.query('UPDATE users SET invite_code=? WHERE id=?', [inviteCode, req.user_id]);
    if(result.affectedRows > 0){ 
      return res.json({msg:'success',code:200,data:{inviteCode: inviteCode}});
    } else {
      return res.json({msg:'设置邀请码失败，请稍后重试',code:400});
    }
    
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 绑定邀请码
const bindInviteCode = async (req, res) => {
  const {parent_invite_code} = req.body;
  try{
    //查看用户是否已经绑定过邀请码
    const user = await pool.query('SELECT parent_invite_code FROM users WHERE id = ?', [req.user_id]);
    if(user.length>0){
      if(user[0].parent_invite_code){
        return res.json({msg:'您已经绑定过邀请码了',code:400});
      }
    }else{
      return res.json({msg:'用户不存在',code:400});
    }

    //查看邀请码是否存在
    const parentUser = await pool.query('SELECT * FROM users WHERE invite_code = ?', [parent_invite_code]);
    if(parentUser.length === 0){
      return res.json({msg:'邀请码不存在',code:400});
    }else{
      //绑定邀请码不能是自己的邀请码
      if(parentUser[0].id === req.user_id){
        return res.json({msg:'不能绑定自己的邀请码',code:400});
      }else{
        //绑定邀请码
        const result = await pool.query('UPDATE users SET parent_invite_code = ? WHERE id = ?', [parent_invite_code, req.user_id]);
        if(result.affectedRows > 0){
          return res.json({msg:'绑定成功',code:200});
        }
      }
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 钱包提现
const withdraw = async (req, res) => {
  const {withdrawBalance,method} = req.body;
  // 请求频繁判断（以用户ID为例，每10秒只能请求一次）
  const methodKey = `${req.user_id}:withdraw`;
  const now = Date.now();
  const lastReq = requestLimitMap.get(methodKey) || 0;
  if(now - lastReq < 10000){
    return res.json({msg:'请求频繁',code:400});
  }
  //获取税金配置
  let taxConfig = await readConfig("tax_config");
  if(!taxConfig){
      taxConfig = require("../datas/tax_config.data")
  }
  
  // 判断是否为国内用户的函数（临时实现，后续可根据实际需求调整）
  const isDomesticUser = async (userId) => {
    // 这里可以根据用户的注册信息、IP地址、身份证等判断
    // 临时返回true，表示默认为国内用户
    const userInfo = await pool.query('SELECT * FROM users_info WHERE user_id =?', [userId]);
    if(userInfo.length>0){
      //根据身份证来判断是否是国内用户 userInfo[0].id_card_number
      const idCardNumber = userInfo[0].id_card_number;
      if(idCardNumber){
        // 中国大陆身份证号码为18位数字（或17位数字+1位校验码X）
        const chinaIdPattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
        // 港澳台身份证格式检查
        const hkIdPattern = /^[A-Z]{1,2}[0-9]{6}\([0-9A]\)$/; // 香港身份证
        const macaoIdPattern = /^[1|5|7][0-9]{6}\([0-9]\)$/; // 澳门身份证
        const taiwanIdPattern = /^[A-Z][12][0-9]{8}$/; // 台湾身份证
        
        if(chinaIdPattern.test(idCardNumber) || hkIdPattern.test(idCardNumber) || 
           macaoIdPattern.test(idCardNumber) || taiwanIdPattern.test(idCardNumber)){
          return true; // 中国大陆、港澳台身份证，视为国内用户
        }
      }
    }
    return false;
  };
  
  // 计算个人所得税的函数
  const calculateIncomeTax = (amount, isDomestic) => {
    const amountInYuan = amount / 100; // 转换为元
    
    // 国内用户：有起征金额，低于起征金额不征税
    if (isDomestic) {
      if (amountInYuan <= taxConfig.taxThreshold) {
        return 0;
      }
      
      // 国内用户对超过起征金额的部分计算税金
      const taxableAmount = amountInYuan - taxConfig.taxThreshold;
      const taxTable = taxConfig.domesticTaxTable;
      return calculateTaxByTable(taxableAmount, taxTable);
    } else {
      // 国外用户：没有起征金额，直接按税率表计算
      const taxTable = taxConfig.foreignTaxTable;
      return calculateTaxByTable(amountInYuan, taxTable);
    }
  };
  
  // 根据税率表计算税金的通用函数
  const calculateTaxByTable = (amountInYuan, taxTable) => {
    // 使用配置中的 minAmount 和 maxAmount 参数来判断税率区间
    for (let i = 0; i < taxTable.length; i++) {
      const bracket = taxTable[i];
      const minAmount = bracket.minAmount || 0;
      const maxAmount = bracket.maxAmount || Infinity;
      
      // 判断金额是否在当前税率区间内
      if (amountInYuan > minAmount && (maxAmount === null || amountInYuan <= maxAmount)) {
        const tax = amountInYuan * (bracket.rate / 100) - bracket.quickDeduction;
        return Math.max(0, tax * 100); // 转换为分，确保不为负数
      }
    }
    
    return 0; // 如果没有匹配的税率区间，返回0
  };
  requestLimitMap.set(methodKey, now);
  try{
    if(withdrawBalance<100){
      return res.json({msg:'提现金额不能低于100',code:400});
    }
    //检测当月有没有提现过
    const withdrawRecord = await pool.query('SELECT * FROM withdraw_order WHERE user_id = ? AND status not in (4,5)  AND DATE_FORMAT(create_time, "%Y%m") = DATE_FORMAT(CURDATE(), "%Y%m")', [req.user_id]);
    if(withdrawRecord.length>0){
      return res.json({msg:'当月已提现过,请下月再提现',code:400});
    }
    let entityData = null
    //获取用户企业id
    const userEntity = await pool.query('SELECT entity_id FROM business_entity_members WHERE user_id =? AND join_status = 1', [req.user_id]);
    if(userEntity.length>0){ 
      const entity_id = userEntity[0].entity_id;
      //获取企业信息
      entityData = await pool.query('SELECT * FROM business_entities WHERE id =?', [entity_id]);
    }
    //获取用户钱包信息
    const walletData = await pool.query('SELECT * FROM users_info WHERE user_id =?', [req.user_id]);
    if(walletData.length>0){
      if(Number(withdrawBalance)*100 > Number(walletData[0].balance)){
        return res.json({msg:'余额不足',code:400});
      }
      //判断用户信息是否完善
      if(walletData[0].state < 3){
        return res.json({msg:'请完善用户信息',code:400});
      }
      //创建提现订单
      const orderNo = await generateRefundNo();
      await pool.query('INSERT INTO withdraw_order SET ?', {
        withdraw_no: orderNo,
        user_id: req.user_id,
        user_name: req.user_name, // 新增用户名
        id_card: walletData[0].id_card_number,     // 新增身份证
        mobile: req.phone,       // 新增手机号
        amount: Number(withdrawBalance) * 100,
        incometax_amount: entityData ? 0 : calculateIncomeTax(Number(withdrawBalance) * 100, await isDomesticUser(req.user_id)), // 有企业信息时，不扣税
        status: 0,
        method: method?method:'alipay',
        bank_account: entityData?entityData[0].bank_card:walletData[0].bank_account_number, // 有企业优先打给企业银行卡
        bank_name: entityData?entityData[0].bank_name:walletData[0].bank_name,       // 有企业优先打给企业银行卡
        remark: '',             // 新增备注
        create_time: new Date(),        // 申请时间
        update_time: new Date()         // 更新时间
      });
      //更新用户余额
      await pool.query('UPDATE users_info SET balance = balance - ? WHERE user_id = ?', [Number(withdrawBalance) * 100, req.user_id]);
      return res.json({msg:'success',code:200});
    }
    return res.json({msg:'error',code:500});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 用户提现类型列表
const getWithdrawType = async (req, res) => {
  try{
    const withdrawType = await pool.query('SELECT * FROM users_info WHERE user_id =?', [req.user_id]);
    if(withdrawType.length==0){
      return res.json({msg:'error',code:400});
    }
    let data = [];
    if(withdrawType[0].state==3){
      if(withdrawType[0].wechat_image_url){
        data.push({label:'微信',value:'wechat'});
      }
      if(withdrawType[0].alipay_image_url){
        data.push({label:'支付宝',value:'alipay'});
      }
      if(withdrawType[0].bank_account_number){
        data.push({label:'银行卡',value:'bank'});
      }
      if(withdrawType[0].paypal_id){
        data.push({label:'PayPal',value:'paypal'});
      }
      //查看是否加入企业
      const enterprise = await pool.query('SELECT * FROM business_entity_members WHERE user_id =? AND join_status = 1', [req.user_id]);
      if(enterprise.length>0){ 
        //查看企业是否审核通过
        const enterpriseInfo = await pool.query('SELECT * FROM business_entities WHERE id =? AND status = 1', [enterprise[0].entity_id]);
        if(enterprise.length>0&&enterpriseInfo.length>0){
          data=[{label:'企业账户',value:'enterprise'}];
        }
      }
      return res.json({msg:'success',code:200,data:data});
    }
    res.json({msg:'请完善用户信息',code:500});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//前端个人中心 购买记录
const getBuyRecord = async (req, res) => {
  const {startTime, endTime} = req.body;
  try{
    let data=[];//前端需要的数据
    //获取用户购买记录
    const buyRecord = await pool.query(`SELECT * FROM pay_order WHERE user_id =? AND status = 1 AND DATE(create_time) BETWEEN? AND? ORDER BY id DESC`, [req.user_id,startTime, endTime]);
    data = buyRecord.map(item=>({
      create_time:formatDateTimeSync(item.create_time),
      order_no:item.order_no,
      merchant_name:item.merchant_name,
      product_type:item.product_type,
      title:item.title,
    }))
    return res.json({msg:'success',code:200,data});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端获取个人详细信息审核状态
const getUserAuditStatus = async (req, res) => {
  try{
    const userinfostate = await pool.query('SELECT state FROM users_info WHERE user_id =?', [req.user_id]);
    if(userinfostate.length>0){
      return res.json({msg:'success',code:200,data:userinfostate[0].state});
    }
    return res.json({msg:'error',code:500});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 获取用户下载记录
const getUserDownloadRecord = async (req, res) => {
  try{
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false', starttime, endtime,project_name, type } = req.query;
    const user_id = req.user_id;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if(key === 'type' || key === 'user_id'){
            // 如果是state字段，则直接使用等于条件
            conditions.push(`${pool.escapeId(key)} =?`);
            params.push(queryParams[key]);
            }else if (key === 'starttime') {
              const formatted = formatToMySQLDateTime(queryParams[key], false);
              console.log(formatted);
              if (formatted) {
                conditions.push(`updated_at >= ?`);
                params.push(formatted);
              }
            } else if (key === 'endtime') {
              const formatted = formatToMySQLDateTime(queryParams[key], true);
              console.log(formatted);
              if (formatted) {
                conditions.push(`updated_at <= ?`);
                params.push(formatted);
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
    const { whereClause, whereParams } = buildWhereClause({ starttime, endtime,project_name, type,user_id });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`
      SELECT COUNT(*) AS total FROM user_download_records
      ${whereClause}
    `,[...whereParams]);
    const total = Number(totalRows[0].total)||0;
    // 分页查询
    const rows = await pool.query(
      `SELECT * FROM user_download_records
      ${whereClause}
      ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
      LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      created_at:formatDate(row.created_at),
      updated_at:formatDate(row.updated_at),
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
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 下载记录数据删除
const deleteDownloadRecord = async (req, res) => {
  const {project_id,type} = req.body;
  try{
    await pool.query('DELETE FROM user_download_records WHERE project_id = ? AND type = ? AND user_id = ?', [project_id,type,req.user_id]);
    return res.json({msg:'success',code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端用户对项目收藏
const collectProject = async (req, res) => {
  const {project_id,project_name,type} = req.body;
  
  // 请求频繁判断（以用户ID和项目ID为例，每3秒只能请求一次）
  const methodKey = `${req.user_id}:collectProject:${project_id}:${type}`;
  const now = Date.now();
  const lastReq = requestLimitMap.get(methodKey) || 0;
  if (now - lastReq < 3000) {
    return res.json({msg:'操作过于频繁，请稍后再试',code:-1});
  }
  requestLimitMap.set(methodKey, now);
  
  try{
    //判断是否已经收藏
    const checkResult = await pool.query('SELECT id FROM project_favorite_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,project_id,type]);
    if(checkResult.length>0){
      await pool.query('DELETE FROM project_favorite_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,project_id,type]);
      //总收藏数-1
      if(type==0){
        await pool.query('UPDATE upload SET favorite_count = favorite_count - 1 WHERE id = ?', [project_id]);
      }else{
        await pool.query('UPDATE upload_resources SET favorite_count = favorite_count - 1 WHERE id = ?', [project_id]);
      }
      return res.json({msg:'已取消收藏',code:100});
    }else{
      await pool.query('INSERT INTO project_favorite_records SET ?', {user_id:req.user_id,project_id:project_id,project_name:project_name,type:type});
      //总收藏数+1
      if(type==0){
        await pool.query('UPDATE upload SET favorite_count = favorite_count + 1 WHERE id = ?', [project_id]);
      }else{
        await pool.query('UPDATE upload_resources SET favorite_count = favorite_count + 1 WHERE id = ?', [project_id]);
      }
      return res.json({msg:'已收藏',code:200});
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端用户对项目点赞
const likeProject = async (req, res) => {
  const {project_id,type} = req.body;
  
  // 请求频繁判断（以用户ID和项目ID为例，每3秒只能请求一次）
  const methodKey = `${req.user_id}:likeProject:${project_id}:${type}`;
  const now = Date.now();
  const lastReq = requestLimitMap.get(methodKey) || 0;
  if (now - lastReq < 3000) {
    return res.json({msg:'操作过于频繁，请稍后再试',code:-1});
  }
  requestLimitMap.set(methodKey, now);
  
  try{
    // 获取项目作者信息
    let projectOwner;
    if(type == 0){
      const projectResult = await pool.query('SELECT user_id FROM upload WHERE id = ?', [project_id]);
      projectOwner = projectResult[0].user_id;
    } else {
      const resourceResult = await pool.query('SELECT user_id FROM upload_resources WHERE id = ?', [project_id]);
      projectOwner = resourceResult[0].user_id;
    }
    
    //判断是否已经点赞
    const checkResult = await pool.query('SELECT id FROM user_like_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,project_id,type]);
    if(checkResult.length>0){
      const likeRecordId = checkResult[0].id;
      await pool.query('DELETE FROM user_like_records WHERE user_id = ? AND project_id = ? AND type = ?', [req.user_id,project_id,type]);
      //总点赞数-1
      if(type==0){
        await pool.query('UPDATE upload SET like_count = like_count - 1 WHERE id = ?', [project_id]);
      }else{
        await pool.query('UPDATE upload_resources SET like_count = like_count - 1 WHERE id = ?', [project_id]);
      }
      
      // 发送取消点赞消息通知（避免向自己发送）
      if(projectOwner && projectOwner != req.user_id) {
        try {
          await pool.query(
            'INSERT INTO like_message (user_id, liker_id, like_id, content_type, project_id, project_type, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [projectOwner, req.user_id, likeRecordId, 2, project_id, type, 2]
          );
        } catch (msgError) {
          console.error('发送取消点赞消息失败:', msgError);
        }
      }
      
      return res.json({msg:'已取消点赞',code:100});
    }else{
      const insertResult = await pool.query('INSERT INTO user_like_records SET ?', {user_id:req.user_id,project_id:project_id,type:type});
      const newLikeId = insertResult.insertId;
      
      //总点赞数+1
      if(type==0){
        await pool.query('UPDATE upload SET like_count = like_count + 1 WHERE id = ?', [project_id]);
      }else{
        await pool.query('UPDATE upload_resources SET like_count = like_count + 1 WHERE id = ?', [project_id]);
      }
      
      // 发送点赞消息通知（避免向自己发送）
      if(projectOwner && projectOwner != req.user_id) {
        try {
          await pool.query(
            'INSERT INTO like_message (user_id, liker_id, like_id, content_type, project_id, project_type, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [projectOwner, req.user_id, newLikeId, 2, project_id, type, 1]
          );
        } catch (msgError) {
          console.error('发送点赞消息失败:', msgError);
        }
      }
      
      return res.json({msg:'已点赞',code:200});
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 获取用户收藏记录
const getUserFavoritesRecord = async (req, res) => {
  try{
    // 获取查询参数
    const { size = '10', current = '1', sortField = 'id', asc = 'false',project_name, type } = req.query;
    const user_id = req.user_id;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';

    function buildWhereClause(queryParams) {
      const conditions = [];
      const params = [];

      for (const key in queryParams) {
        if (queryParams[key] && queryParams[key] !== '') {
          if(key === 'type' || key === 'user_id'){
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
    const { whereClause, whereParams } = buildWhereClause({project_name, type,user_id });

    console.log(whereClause);

    // 获取总记录数
    const totalRows = await pool.query(`
      SELECT COUNT(*) AS total FROM project_favorite_records
      ${whereClause}
    `,[...whereParams]);
    const total = Number(totalRows[0].total)||0;
    // 分页查询
    const rows = await pool.query(
      `SELECT * FROM project_favorite_records
      ${whereClause}
      ORDER BY ${pool.escapeId(sortField)} ${sortOrder}
      LIMIT ?, ?`,
      [...whereParams, offset, limit]
    );

    // 准备响应数据
    const data = rows.map(row => ({
      ...row,
      created_at:formatDate(row.created_at)
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
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 获取用户设备信息
const getUserDeviceInfo = async (req, res) => {
  try{
    //获取平台配置V2
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
        payConfig = require("../datas/pay_platform_cfg_v2.data")
    }
    const userDeviceInfo = await pool.query('SELECT * FROM user_machines WHERE user_id =?', [req.user_id]);
    return res.json({msg:'success',code:200,data:userDeviceInfo,macCount:Number(payConfig.machine_code_count)});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//前端个人中心 删除用户设备信息
const deleteUserDeviceInfo = async (req, res) => {
  const {id,noCount} = req.body;
  try{
    //获取平台配置V2
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
        payConfig = require("../datas/pay_platform_cfg_v2.data")
    }
    //查询用户机械码修改次数
    const userMachineModifyCount = await pool.query('SELECT machine_code_change_count FROM users WHERE id =?', [req.user_id]);
    if(userMachineModifyCount[0].machine_code_change_count >= payConfig.machine_code_modify_count){
      return res.json({msg:'机械码修改次数已达到上限',code:400});
    }
    await pool.query('DELETE FROM user_machines WHERE id = ? AND user_id = ?', [id,req.user_id]);
    await pool.query('UPDATE users SET machine_count = machine_count - 1 WHERE id = ?', [req.user_id]);
    if(noCount){
      await pool.query('UPDATE users SET machine_code_change_count = machine_code_change_count + 1 WHERE id = ?', [req.user_id]);
    }
    return res.json({msg:'success',code:200});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}
//用户市场获取评论
const getMarketComment = async (req, res) => {
  const { project_id, project_type, parent_id = null, page = 1, size = 10 } = req.query;
  // 根据用户登录状态决定实际的size和offset
  const actualSize = !req.user_id ? 10 : parseInt(size);
  const offset = !req.user_id ? 0 : (parseInt(page) - 1) * actualSize;
  try {
    const where = ['c.project_id = ?', 'c.project_type = ?'];
    const params = [project_id, project_type];
    if (parent_id !== null && parent_id !== '' && parent_id !== undefined) {
      where.push('c.parent_id = ?');
      params.push(parent_id);
    } else {
      where.push('c.parent_id IS NULL');
    }
    // 根据用户登录状态限制总数查询
    let totalQuery;
    let totalParams;
    if (!req.user_id) {
      // 未登录用户，总数限制为5
      totalQuery = `SELECT LEAST(COUNT(*), 5) as total FROM comment c WHERE ${where.join(' AND ')}`;
      totalParams = params;
    } else {
      // 已登录用户，正常查询总数
      totalQuery = `SELECT COUNT(*) as total FROM comment c WHERE ${where.join(' AND ')}`;
      totalParams = params;
    }
    
    const totalRows = await pool.query(totalQuery, totalParams);
    const total = totalRows[0].total;
    
    // 主查询：获取评论并判断用户角色
    const rows = await pool.query(
      `SELECT c.*, u.username, ui.avatar_url AS avatar,ui.alias,
        (SELECT ${!req.user_id ? 'LEAST(COUNT(*), 5)' : 'COUNT(*)'} FROM comment r WHERE r.parent_id = c.id) AS reply_total,
        CASE 
          WHEN c.project_type = '0' THEN 
            CASE WHEN up.user_id = c.user_id THEN '作者' ELSE '普通用户' END
          ELSE 
            CASE WHEN ur.user_id = c.user_id THEN '作者' ELSE '普通用户' END
        END AS user_role,
        CASE 
          WHEN u.vip_type = 2 THEN '会员'
          WHEN u.vip_type = 1 AND u.vip_expire_time > NOW() THEN '会员'
          ELSE '普通用户'
        END AS vip_status
       FROM comment c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN users_info ui ON u.id = ui.user_id
       LEFT JOIN upload up ON c.project_id = up.id AND c.project_type = '0'
       LEFT JOIN upload_resources ur ON c.project_id = ur.id AND c.project_type != '0'
       WHERE ${where.join(' AND ')}
       ORDER BY c.create_time DESC
       LIMIT ?, ?`,
      [...params, offset, parseInt(actualSize)]
    );
    
    // 获取所有父评论id
    const parentIds = rows.map(row => row.id);
    let replyMap = {};
    if (parentIds.length > 0) {
      // 批量查所有子评论，同样包含用户角色信息，限制每个父评论最多10条回复
      const replyRows = await pool.query(
        `SELECT c.*, u.username, ui.avatar_url AS avatar, ui.alias,
          CASE 
            WHEN c.project_type = '0' THEN 
              CASE WHEN up.user_id = c.user_id THEN '作者' ELSE '普通用户' END
            ELSE 
              CASE WHEN ur.user_id = c.user_id THEN '作者' ELSE '普通用户' END
          END AS user_role,
          CASE 
            WHEN u.vip_type = 2 THEN '会员'
            WHEN u.vip_type = 1 AND u.vip_expire_time > NOW() THEN '会员'
            ELSE '普通用户'
          END AS vip_status
        FROM comment c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users_info ui ON u.id = ui.user_id
        LEFT JOIN upload up ON c.project_id = up.id AND c.project_type = '0'
        LEFT JOIN upload_resources ur ON c.project_id = ur.id AND c.project_type != '0'
        WHERE c.parent_id IN (${parentIds.map(() => '?').join(',')})
          AND c.project_id = ?
          AND c.project_type = ?
          AND (
            SELECT COUNT(*) 
            FROM comment c2 
            WHERE c2.parent_id = c.parent_id 
              AND c2.create_time <= c.create_time 
              AND c2.id <= c.id
          ) <= 5
        ORDER BY c.parent_id, c.create_time ASC`,
        [...parentIds, project_id, project_type]
      );
      // 按 parent_id 分组
      replyMap = replyRows.reduce((acc, cur) => {
        if (!acc[cur.parent_id]) acc[cur.parent_id] = [];
        let finalUserRole = '普通用户';
        if (cur.user_role === '作者') {
          finalUserRole = '作者';
        } else if (cur.vip_status === '会员') {
          finalUserRole = '会员';
        }
        acc[cur.parent_id].push({
          ...cur,
          create_time: formatDate(cur.create_time),
          user_role: finalUserRole
        });
        return acc;
      }, {});
    }
    
    // 组装数据，确定最终的用户角色显示
    const datas = rows.map(row => {
      // 确定最终显示的用户角色：作者 > 会员 > 普通用户
      let finalUserRole = '普通用户';
      if (row.user_role === '作者') {
        finalUserRole = '作者';
      } else if (row.vip_status === '会员') {
        finalUserRole = '会员';
      }
      
      return {
        ...row,
        create_time: formatDate(row.create_time),
        user_role: finalUserRole, // 使用最终确定的用户角色
        reply: replyMap[row.id] || []
      };
    });
    
    res.json({ code: 0, msg: 'success', data: { total, records: datas } });
  } catch (error) {
    console.error(error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

// 发布市场评论
const publishMarketComment = async (req, res) => {
  const { parent_id = null, content, project_id, project_type } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // 处理 IPv4-mapped IPv6 地址，提取纯 IPv4 地址
  let cleanIp = clientIp;
  if (clientIp && clientIp.includes('::ffff:')) {
    cleanIp = clientIp.replace('::ffff:', '');
  }
  
  console.log('Original IP:', clientIp);
  console.log('Clean IP:', cleanIp);
  
  const user_id = req.user_id;
  if (
    !content ||
    !project_id ||
    project_type === null ||
    project_type === undefined ||
    project_type === ''
  ) {
    return res.json({ code: -1, msg: '参数缺失' });
  }
  //判断用户是否禁言
  const getbandate = await pool.query(
    'SELECT status,ban_expire_time FROM users WHERE id = ?',
    [user_id]
  );
  if (getbandate[0].status == 1 && getbandate[0].ban_expire_time > Date.now()) { //用户被禁言
    const banExpireDate = formatDate(getbandate[0].ban_expire_time);
    return res.json({ code: -1, msg: `您已被禁言，禁言到期时间：${banExpireDate}` });
  }else if (getbandate[0].status == 2 && getbandate[0].ban_expire_time > Date.now()) { //用户被封禁
    const banExpireDate = formatDate(getbandate[0].ban_expire_time);
    return res.json({ code: -1, msg: `您已被封禁，封禁到期时间：${banExpireDate}` });
  }else if (getbandate[0].status == 3) { //用户被永久封禁
    return res.json({ code: -1, msg: '您已被永久封禁' });
  }
  //获取屏蔽词列表
  let messageBlockList = await readConfig("message_block_list");
  if(!messageBlockList){
    messageBlockList = require("../datas/message_block_list.data")
  }
  if(!messageBlockList.commenthttp){ //判断是否可以发链接
    if(isContainsLink(content,true)){
      return res.json({ code: -1, msg: '评论内容不能包含链接' });
    }
  }
  const bannedResult = await containsBannedWords(content, messageBlockList.list);
  let replacedContent = content;
  //将屏蔽词替换为*
  if (bannedResult.hasBannedWords) {
    //bannedResult.bannedWord有多少个字符就替换多少个*
    const bannedWord = bannedResult.bannedWord;
    const replacement = '*'.repeat(bannedWord.length);
    replacedContent = content.replace(new RegExp(bannedWord, 'g'), replacement);
  }
  
  try {
    // 检查评论频率限制（30秒内只能发送一条评论）
    const methodKey = `${user_id}:publishMarketComment`;
    const now = Date.now();
    const lastReq = requestLimitMap.get(methodKey) || 0;
    if (now - lastReq < 30000) { // 30秒 = 30000毫秒
      return res.json({ code: -4, msg: '评论发送过于频繁，请30秒后再试' });
    }
    requestLimitMap.set(methodKey, now);
    
    // 检查用户今日评论数量限制（每天最多100条评论）
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const dailyCommentCount = await pool.query(
      'SELECT COUNT(*) as count FROM comment WHERE user_id = ? AND create_time >= ? AND create_time <= ?',
      [user_id, startOfDay, endOfDay]
    );
    
    if (dailyCommentCount[0].count >= 100) {
      return res.json({ code: -3, msg: '今日评论数量已达上限（100条），请明天再试' });
    }
    
    // 如果有父评论ID，验证父评论是否存在
    if (parent_id) {
      const parentComment = await pool.query(
        'SELECT id FROM comment WHERE id = ? AND project_id = ? AND project_type = ?',
        [parent_id, project_id, project_type]
      );
      
      if (parentComment.length === 0) {
        return res.json({ code: -2, msg: '父评论不存在或已被删除' });
      }
    }
    
    // 插入评论
    const commentResult = await pool.query(
      'INSERT INTO comment (parent_id, user_id, content, project_id, project_type, address, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [parent_id, user_id, replacedContent, project_id, project_type, null, cleanIp]
    );
    
    const commentId = commentResult.insertId;
    
    // 发送消息通知
    try {
      let targetUserId = null;
      let messageType = 1; // 默认为新评论
      
      if (parent_id) {
        // 如果是回复评论，获取被回复评论的作者ID
        const parentCommentResult = await pool.query(
          'SELECT user_id FROM comment WHERE id = ?',
          [parent_id]
        );
        
        if (parentCommentResult.length > 0) {
          targetUserId = parentCommentResult[0].user_id;
          messageType = 2; // 回复评论
        }
      } else {
        // 如果是新评论，获取项目作者ID
        let projectAuthorQuery;
        if (project_type == 0) {
          // app类型项目
          projectAuthorQuery = 'SELECT user_id FROM upload WHERE id = ?';
        } else {
          // 其他类型项目（model/plugin/workflow）
          projectAuthorQuery = 'SELECT user_id FROM upload_resources WHERE id = ?';
        }
        
        const projectAuthorResult = await pool.query(projectAuthorQuery, [project_id]);
        
        if (projectAuthorResult.length > 0) {
          targetUserId = projectAuthorResult[0].user_id;
          messageType = 1; // 新评论
        }
      }
      // 只有当目标用户不是评论者本人时才发送通知
      if (targetUserId && targetUserId !== user_id) {
        await pool.query(
          'INSERT INTO comment_message (user_id, commenter_id, comment_id, project_id, project_type, message_type) VALUES (?, ?, ?, ?, ?, ?)',
          [targetUserId, user_id, commentId, project_id, project_type, messageType]
        );
      }
    } catch (messageError) {
      // 消息通知失败不影响评论发布
      console.error('发送评论消息通知失败:', messageError);
    }

    if (bannedResult.hasBannedWords) {
      return res.json({ code: 0, msg: `评论内容包含敏感词: ${bannedResult.bannedWord}`,err:true });
    }
    
    res.json({ code: 0, msg: 'success' });
  } catch (error) {
    console.error(error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

//用户获取评论消息列表
const getCommentMsgList = async (req, res) => {
  const user_id = req.user_id;
  try {
    // 获取分页参数
    const { size = '10', current = '1', asc = 'false' } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';
    
    // 获取总记录数（近3个月）
    const totalRows = await pool.query(`
      SELECT COUNT(*) AS total FROM comment_message
      WHERE user_id = ? AND create_time >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
    `, [user_id]);
    const total = Number(totalRows[0].total) || 0;
    
    //获取评论消息列表
    const commentMsgListQuery = `
      SELECT cm.*, 
            u.username,
            ui.avatar_url,
            ui.alias,
            CASE 
              WHEN cm.project_type = 0 THEN up.plugin_name
              ELSE ur.res_name
            END as project_name,
            c.content as comment,
            CASE 
              WHEN cm.message_type = 2 THEN pc.content
              ELSE NULL
            END as original_content
      FROM comment_message cm
      LEFT JOIN users u ON cm.commenter_id = u.id
      LEFT JOIN users_info ui ON u.id = ui.user_id
      LEFT JOIN upload up ON cm.project_id = up.id AND cm.project_type = 0
      LEFT JOIN upload_resources ur ON cm.project_id = ur.id AND cm.project_type != 0
      LEFT JOIN comment c ON cm.comment_id = c.id
      LEFT JOIN comment pc ON c.parent_id = pc.id AND cm.message_type = 2
      WHERE cm.user_id = ? AND cm.create_time >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      ORDER BY cm.create_time ${sortOrder}
      LIMIT ?, ?
    `;
    console.log(commentMsgListQuery);
    const requst = await pool.query(commentMsgListQuery, [user_id, offset, limit]);

    // 将获取到的未读消息设置为已读
    if (requst.length > 0) {
      const unreadIds = requst.filter(msg => msg.is_read === 0).map(msg => msg.id);
      if (unreadIds.length > 0) {
        await pool.query(`
          UPDATE comment_message 
          SET is_read = 1 
          WHERE id IN (${unreadIds.map(() => '?').join(',')}) AND user_id = ?
        `, [...unreadIds, user_id]);
        
        // 更新返回数据中的 is_read 状态
        requst.forEach(msg => {
          if (unreadIds.includes(msg.id)) {
            msg.is_read = 1;
          }
        });
      }
    }

    // 发送 JSON 响应
    res.json({ 
      code: 0, 
      msg: 'success', 
      data: {
        total,
        size,
        current,
        records: requst
      }
    });
  }catch (error) {
    console.error(error);
    res.json({ code: -500, msg: 'Database error' });
  }
}

//用户获取点赞消息列表
const getLikeMsgList = async (req, res) => { 
  const user_id = req.user_id;
  try {
    // 获取分页参数
    const { size = '10', current = '1', asc = 'false' } = req.query;
    const limit = parseInt(size, 10);
    const offset = (parseInt(current, 10) - 1) * limit;
    const isAsc = asc === 'true';
    const sortOrder = isAsc ? 'ASC' : 'DESC';
    
    // 获取总记录数（近3个月）
    const totalRows = await pool.query(`
      SELECT COUNT(*) AS total FROM like_message
      WHERE user_id = ? AND message_type = 1 AND create_time >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
    `, [user_id]);
    const total = Number(totalRows[0].total) || 0;
    
    //获取点赞消息列表
    const likeMsgListQuery = `
      SELECT lm.*, 
            u.username,
            ui.avatar_url,
            ui.alias,
            CASE 
              WHEN lm.project_type = '0' THEN up.plugin_name
              ELSE ur.res_name
            END as project_name,
            CASE 
              WHEN lm.content_type = 1 THEN c.content
              ELSE NULL
            END as comment_content
      FROM like_message lm
      LEFT JOIN users u ON lm.liker_id = u.id
      LEFT JOIN users_info ui ON u.id = ui.user_id
      LEFT JOIN upload up ON lm.project_id = up.id AND lm.project_type = '0'
      LEFT JOIN upload_resources ur ON lm.project_id = ur.id AND lm.project_type != '0'
      LEFT JOIN comment c ON lm.content_type = 1 AND lm.like_id IN (
        SELECT cl.id FROM comment_likes cl WHERE cl.comment_id = c.id
      )
      WHERE lm.user_id = ? AND lm.message_type = 1 AND lm.create_time >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      ORDER BY lm.create_time ${sortOrder}
      LIMIT ?, ?
    `;
    console.log(likeMsgListQuery);
    const request = await pool.query(likeMsgListQuery, [user_id, offset, limit]);

    // 将获取到的未读消息设置为已读
    if (request.length > 0) {
      const unreadIds = request.filter(msg => msg.is_read === 0).map(msg => msg.id);
      if (unreadIds.length > 0) {
        await pool.query(`
          UPDATE like_message 
          SET is_read = 1 
          WHERE id IN (${unreadIds.map(() => '?').join(',')}) AND user_id = ?
        `, [...unreadIds, user_id]);
        
        // 更新返回数据中的 is_read 状态
        request.forEach(msg => {
          if (unreadIds.includes(msg.id)) {
            msg.is_read = 1;
          }
        });
      }
    }

    // 发送 JSON 响应
    res.json({ 
      code: 0, 
      msg: 'success', 
      data: {
        total,
        size,
        current,
        records: request
      }
    });
  } catch (error) { 
    console.error(error);
    res.json({ code: -500, msg: 'Database error' });
  }
};

// 评论点赞/取消点赞
const likeMarketComment = async (req, res) => {
  const { comment_id } = req.body;
  const user_id = req.user_id;
  if (!comment_id) {
    return res.json({ code: -1, msg: '参数缺失' });
  }
  try {
    // 获取评论作者信息和项目信息
    const commentInfo = await pool.query(
      'SELECT user_id, project_id, project_type FROM comment WHERE id = ?',
      [comment_id]
    );
    if (commentInfo.length === 0) {
      return res.json({ code: -1, msg: '评论不存在' });
    }
    const commentAuthor = commentInfo[0].user_id;
    const projectId = commentInfo[0].project_id;
    const projectType = commentInfo[0].project_type;
    
    // 检查是否已点赞
    const exist = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [comment_id, user_id]
    );
    if (exist.length > 0) {
      // 已点赞，取消点赞
      const likeRecordId = exist[0].id;
      await pool.query(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [comment_id, user_id]
      );
      await pool.query(
        'UPDATE comment SET likes = GREATEST(likes - 1, 0) WHERE id = ?',
        [comment_id]
      );
      
      // 发送取消点赞消息通知（避免向自己发送）
      if (commentAuthor && commentAuthor != user_id) {
        try {
          await pool.query(
            'INSERT INTO like_message (user_id, liker_id, like_id, content_type, project_id, project_type, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [commentAuthor, user_id, likeRecordId, 1, projectId, projectType, 2]
          );
        } catch (msgError) {
          console.error('发送取消点赞消息失败:', msgError);
        }
      }
      
      return res.json({ code: 0, msg: '取消点赞成功', liked: false });
    } else {
      // 未点赞，执行点赞
      const insertResult = await pool.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
        [comment_id, user_id]
      );
      const newLikeId = insertResult.insertId;
      
      await pool.query(
        'UPDATE comment SET likes = likes + 1 WHERE id = ?',
        [comment_id]
      );
      
      // 发送点赞消息通知（避免向自己发送）
      if (commentAuthor && commentAuthor != user_id) {
        try {
          await pool.query(
            'INSERT INTO like_message (user_id, liker_id, like_id, content_type, project_id, project_type, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [commentAuthor, user_id, newLikeId, 1, projectId, projectType, 1]
          );
        } catch (msgError) {
          console.error('发送点赞消息失败:', msgError);
        }
      }
      
      return res.json({ code: 0, msg: '点赞成功', liked: true });
    }
  } catch (error) {
    console.error(error);
    res.json({ code: -500, msg: 'Database error' });
  }
};
//评论图片上传
const uploadMarketCommentImage = async (req, res) => {
  try{
    // console.log(req.files.image)
    let userDir = './comment/' + req.user_id + "/";
    let imagePath = ''; // 声明变量
    
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
    if(req.files && req.files.image){
      imagePath = userDir + new Date().getTime() + '.png';
      let imageObj = req.files.image;
      
      await new Promise((resolve, reject) => {
        imageObj.mv(imagePath, (err) => {
          if(err){
            console.error("Upload image error:" + err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // 返回完整的图片URL路径
      const imageUrl = `${req.user_id}/${imagePath.split('/').pop()}`;
      console.log(imageUrl);
      return res.json({code: 0, msg: 'success', data: {url: imageUrl}});
    } else {
      return res.json({code: -1, msg: 'No image file uploaded'});
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Upload error' });
  }
}
//用户市场删除评论
const deleteMarketComment = async (req, res) => {
  const {comment_id} = req.body;
  try{
    //查询评论是否存在
    const comment = await pool.query('SELECT * FROM comment WHERE id = ?', [comment_id]);
    if(comment.length === 0){
      return res.json({code: -1, msg: '评论不存在'});
    }
    //查询项目创建人
    let projectData;
    let projectOwnerId = null;

    if(comment[0].project_type>0){
      projectData = await pool.query('SELECT user_id FROM upload_resources WHERE id = ?', [comment[0].project_id]);
    }else{
      projectData = await pool.query('SELECT user_id FROM upload WHERE id = ?', [comment[0].project_id]);
    }
    // 检查项目是否存在
    if (projectData && projectData.length > 0) {
      projectOwnerId = projectData[0].user_id;
    }
    //查询用户有没有权限删除评论
    // 权限：1. 评论作者本人 2. 管理员 3. 项目创建者
    if(comment[0].user_id !== req.user_id && req.user_role != 1 && (projectOwnerId === null || req.user_id !== projectOwnerId)){
      return res.json({code: -1, msg: '没有权限删除评论'});
    }
        
    // 获取所有子评论（用于删除图片）
    const childComments = await pool.query('SELECT * FROM comment WHERE parent_id = ?', [comment_id]);
    
    // 删除图片文件的函数
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
    
    // 删除主评论的图片
    await deleteCommentImages(comment[0].content);
    
    // 删除所有子评论的图片
    for (const childComment of childComments) {
      await deleteCommentImages(childComment.content);
      //删除评论消息通知表相关记录
      await pool.query('DELETE FROM comment_message WHERE comment_id = ?', [childComment.id]);
    }

    //删除评论消息通知表相关记录
    await pool.query('DELETE FROM comment_message WHERE comment_id = ?', [comment_id]);
    
    // 删除该评论的所有子评论（级联删除）
    await pool.query('DELETE FROM comment WHERE parent_id = ?', [comment_id]);

    const likes = await pool.query('SELECT * FROM comment_likes WHERE comment_id = ?', [comment_id]);
    for (const like of likes) {
      await pool.query('DELETE FROM like_message WHERE like_id = ? AND content_type = 1', [like.id]);
    }
    
    // 删除该评论的点赞记录
    await pool.query('DELETE FROM comment_likes WHERE comment_id = ?', [comment_id]);
    
    // 删除该评论的所有举报记录
    await pool.query('DELETE FROM comment_reports WHERE comment_id = ?', [comment_id]);
    
    //删除评论本身
    await pool.query('DELETE FROM comment WHERE id = ?', [comment_id]);
    
    return res.json({code: 0, msg: 'success'});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Delete error' });
  }
}
//用户评论消息删除对应消息
const deleteCommentMsg = async (req, res) => {
  let {comment_id} = req.body;
  let comment_ids = comment_id
  try{
    //查询评论是否存在
    let comment = await pool.query('SELECT * FROM comment WHERE id = ?', [comment_id]);
    if(comment.length === 0){
      return res.json({code: -1, msg: '评论不存在'});
    }
    //查看是否有父评论
    if(comment[0].parent_id){
      comment_id = comment[0].parent_id
      comment = await pool.query('SELECT * FROM comment WHERE id = ?', [comment_id]);
      if(comment.length === 0){
        return res.json({code: -1, msg: '评论不存在'});
      }
    }
    //查询项目创建人
    let projectData;
    let projectOwnerId = null;

    if(comment[0].project_type>0){
      projectData = await pool.query('SELECT user_id FROM upload_resources WHERE id = ?', [comment[0].project_id]);
    }else{
      projectData = await pool.query('SELECT user_id FROM upload WHERE id = ?', [comment[0].project_id]);
    }
    // 检查项目是否存在
    if (projectData && projectData.length > 0) {
      projectOwnerId = projectData[0].user_id;
    }
    //查询用户有没有权限删除评论
    // 权限：1. 评论作者本人 2. 管理员 3. 项目创建者
    if(comment[0].user_id !== req.user_id && req.user_role != 1 && (projectOwnerId === null || req.user_id !== projectOwnerId)){
      return res.json({code: -1, msg: '没有权限删除评论'});
    }
        
    // 获取所有子评论（用于删除图片,删除评论消息）
    const childComments = await pool.query('SELECT * FROM comment WHERE parent_id = ?', [comment_id]);
    
    // 删除图片文件的函数
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
    
    // 删除主评论的图片
    await deleteCommentImages(comment[0].content);
    
    // 删除所有子评论的图片，并级联删除子评论
    for (const childComment of childComments) {
      await deleteCommentImages(childComment.content);
      //删除评论消息通知表相关记录
      await pool.query('DELETE FROM comment_message WHERE comment_id = ?', [childComment.id]);
    }

    //删除评论消息通知表相关记录
    await pool.query('DELETE FROM comment_message WHERE comment_id = ?', [comment_id]);
    
    // 删除该评论的所有子评论（级联删除）
    await pool.query('DELETE FROM comment WHERE parent_id = ?', [comment_id]);

    const likes = await pool.query('SELECT * FROM comment_likes WHERE comment_id = ?', [comment_id]);
    for (const like of likes) {
      await pool.query('DELETE FROM like_message WHERE like_id = ? AND content_type = 1', [like.id]);
    }
    
    // 删除该评论的点赞记录
    await pool.query('DELETE FROM comment_likes WHERE comment_id = ?', [comment_id]);
    
    // 删除该评论的所有举报记录
    await pool.query('DELETE FROM comment_reports WHERE comment_id = ?', [comment_id]);
    
    //删除评论本身
    await pool.query('DELETE FROM comment WHERE id = ?', [comment_id]);
    
    return res.json({code: 0, msg: 'success'});
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Delete error' });
  }
}

//用户市场举报评论
const reportMarketComment = async (req, res) => {
  const { comment_id, reason, description = '' } = req.body;
  const user_id = req.user_id;
  
  if (!comment_id || !reason) {
    return res.json({ code: -1, msg: '参数缺失' });
  }
  
  try {
    // 检查评论是否存在
    const comment = await pool.query('SELECT id FROM comment WHERE id = ?', [comment_id]);
    if (comment.length === 0) {
      return res.json({ code: -2, msg: '评论不存在' });
    }
    
    // 检查用户是否已经举报过该评论
    const existingReport = await pool.query(
      'SELECT id FROM comment_reports WHERE comment_id = ? AND user_id = ?',
      [comment_id, user_id]
    );
    
    if (existingReport.length > 0) {
      return res.json({ code: -3, msg: '您已经举报过该评论' });
    }
    
    // 插入举报记录
    await pool.query(
      'INSERT INTO comment_reports (comment_id, user_id, reason, description) VALUES (?, ?, ?, ?)',
      [comment_id, user_id, reason, description]
    );
    
    // 更新评论的举报次数
    await pool.query(
      'UPDATE comment SET report_count = report_count + 1 WHERE id = ?',
      [comment_id]
    );
    
    res.json({ code: 0, msg: '举报成功' });
  } catch (error) {
    console.error(error);
    res.json({ code: -500, msg: 'Database error' });
  }
}

//用户市场评论获取用户数据
const getMarketCommentUserData = async (req, res) => {
  const { uid,project_id,project_type } = req.body;
  if (
    !uid ||
    !project_id ||
    project_type === null ||
    project_type === undefined ||
    project_type === ''
  ) {
    return res.json({ code: -1, msg: '参数缺失' });
  }
  try{
    let data={};
    const user = await pool.query(
      'SELECT u.*, ui.avatar_url,ui.alias FROM users u LEFT JOIN users_info ui ON u.id = ui.user_id WHERE u.id = ?',
      [uid]
    );
    if(user.length === 0){
      return res.json({ code: -2, msg: '用户不存在' });
    }
    // 获取用户项目下载量和点赞量以及收藏量
    const projectStatsResult = await pool.query('SELECT SUM(download) AS total_downloads, SUM(like_count) AS total_likes,SUM(favorite_count) AS total_favorite FROM upload WHERE user_id = ?', [uid]);
    // 获取用户资源下载量和点赞量以及收藏量
    const resourceStatsResult = await pool.query('SELECT SUM(download) AS total_resource_downloads, SUM(like_count) AS total_resource_likes,SUM(favorite_count) AS total_resource_favorite FROM upload_resources WHERE user_id = ?', [uid]);
    // 获取总下载量和点赞量以及收藏量
    data.download = (projectStatsResult[0].total_downloads || 0) + (resourceStatsResult[0].total_resource_downloads || 0);
    data.like = (projectStatsResult[0].total_likes || 0) + (resourceStatsResult[0].total_resource_likes || 0);
    data.favorite = (projectStatsResult[0].total_favorite || 0) + (resourceStatsResult[0].total_resource_favorite || 0);
    // 判断是否是会员
    if(user[0].vip_type==2){
      data.user_role='会员'
    }else if(user[0].vip_type==1 && user[0].vip_expire_time>new Date()){
      data.user_role='会员'
    }else{
      data.user_role='普通用户'
    }
    //判断是否是作者
    if(project_type==0){
      const isAuthor = await pool.query('SELECT id FROM upload WHERE user_id = ? AND id = ?', [uid,project_id]);
      if(isAuthor.length>0){
        data.user_role='作者'
      }
    }else{
      const isAuthor = await pool.query('SELECT id FROM upload_resources WHERE user_id = ? AND id = ? AND res_type = ?', [uid,project_id,project_type]);
      if(isAuthor.length>0){
        data.user_role='作者'
      }
    }
    data.username=user[0].username;
    data.avatar=user[0].avatar_url;
    data.alias=user[0].alias;
    data.uid=user[0].id;
    return res.json({ code: 0, msg: 'success', data: data });
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Get error' });
  }
}
//用户市场评论进入访客页面
const getGuestUserInfo = async (req, res) => {
  const {id} = req.body; //获取用户id
  try{
    let data={};//前端需要的数据
    data.is_vip = false;
    //获取用户信息
    const userData = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if(userData.length > 0){
      data.username = userData[0].username;
      data.email = userData[0].email;
      data.vip_type = userData[0].vip_type;
      //判断是否会员
      if(userData[0].vip_type == 1){ //年度会员
        //判断会员是否过期
        if(userData[0].vip_expire_time > Date.now()){
          data.is_vip = true;
        }
      }else if(userData[0].vip_type == 2){ //终身会员
        data.is_vip = true;
      }
    }
    // 获取用户项目下载量和点赞量以及收藏量
    const projectStatsResult = await pool.query('SELECT SUM(download) AS total_downloads, SUM(like_count) AS total_likes,SUM(favorite_count) AS total_favorite FROM upload WHERE user_id = ?', [id]);
    // 获取用户资源下载量和点赞量以及收藏量
    const resourceStatsResult = await pool.query('SELECT SUM(download) AS total_resource_downloads, SUM(like_count) AS total_resource_likes,SUM(favorite_count) AS total_resource_favorite FROM upload_resources WHERE user_id = ?', [id]);
    // 获取总下载量和点赞量以及收藏量
    data.downloads = (projectStatsResult[0].total_downloads || 0) + (resourceStatsResult[0].total_resource_downloads || 0);
    data.likes = (projectStatsResult[0].total_likes || 0) + (resourceStatsResult[0].total_resource_likes || 0);
    data.favorites = (projectStatsResult[0].total_favorite || 0) + (resourceStatsResult[0].total_resource_favorite || 0);
    //获取用户详细信息
    const Result = await pool.query('SELECT * FROM users_info WHERE user_id = ?', [id]);
    if(Result.length > 0){
      data.avatar_url = Result[0].avatar_url;
      data.InfoState = Result[0].state;
      data.bio = Result[0].bio;
      data.alias = Result[0].alias;
    }else{
      //创建用户详细信息
      await pool.query('INSERT INTO users_info SET?', {
        user_id: id,
      });
      data.balance = 0.00;
      data.avatar_url = '';
    }


    return res.json({msg: 'success',data:data,code:200});
    
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: 'Auth error!!' });
  }
}

//指定用户软件列表
const marketListUser = async (req, res) => {
  try {
    const userId = req.query.userId;
    const favorite = req.query.favorite||false;
    const likes = req.query.likes||false;
    const loadedCount = req.query.loadedCount ? parseInt(req.query.loadedCount) : 0;
    const searchKeyword = req.query.searchKeyword ? req.query.searchKeyword : '';
    const tokenStr = req.query.tk ? req.query.tk : '';
    const orderType = req.query.orderType ? Number(req.query.orderType) : 1;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    const isadmin = await isAdmin(tokenStr);

    let sqlQuery = 'SELECT DISTINCT id, plugin_name, user_name, install_dir, platforms, description, version, author, like_count,favorite_count, download, project_zip_size, price_type, price_value, need_device, image_path, create_time FROM upload u ';
    let queryParams = [];
    let whereClause = '';

    //判断是否查询收藏项目
    if(favorite){
      sqlQuery = 'SELECT DISTINCT u.id, u.plugin_name, u.user_name, u.install_dir, u.platforms, u.description, u.version, u.author, u.like_count, u.favorite_count, u.download, u.project_zip_size, u.price_type, u.price_value, u.need_device, u.image_path, u.create_time FROM upload u INNER JOIN project_favorite_records pfr ON u.id = pfr.project_id ';
      whereClause += `pfr.user_id = ${userId} AND pfr.type = 0 AND `;
    }
    //判断是否查询点赞项目
    if(likes){
      sqlQuery = 'SELECT DISTINCT u.id, u.plugin_name, u.user_name, u.install_dir, u.platforms, u.description, u.version, u.author, u.like_count, u.favorite_count, u.download, u.project_zip_size, u.price_type, u.price_value, u.need_device, u.image_path, u.create_time FROM upload u INNER JOIN user_like_records ulr ON u.id = ulr.project_id ';
      whereClause += `ulr.user_id = ${userId} AND ulr.type = 0 AND `;
    }

    if(!favorite&&!likes){
      //指定用户
      whereClause += `u.user_id = ${userId} AND `;
    }

    //判断系统
    let systemName = detectOperatingSystem(req);
    console.log(systemName)
    if(systemName){
      whereClause += `platforms = '${systemName}' AND `;
    }

    if (!isadmin) {
      whereClause += 'u.state = 1 AND ';
    }

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
    } else if (orderType === 4) {
      orderStr = ' ORDER BY favorite_count DESC';
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
//指定用户模型，插件，工作流列表
const marketResourcesListUser = async (req, res) => {
  try {
    const userId = req.query.userId;
    const favorite = req.query.favorite||false;
    const likes = req.query.likes||false;
    const loadedCount = req.query.loadedCount ? parseInt(req.query.loadedCount) : 0;
    const searchKeyword = req.query.searchKeyword ? req.query.searchKeyword : '';
    const tokenStr = req.query.tk ? req.query.tk : '';
    const orderType = req.query.orderType ? Number(req.query.orderType) : 1;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const resType = req.query.resType ? req.query.resType : 1;

    const isadmin = await isAdmin(tokenStr);

    let sqlQuery = 'SELECT DISTINCT id, res_name, user_name, install_dir, platforms, short_desc, version, author, like_count,favorite_count, download, res_zip_size, price_type, price_value,res_type, image_path, create_time,ext_option FROM upload_resources u ';
    let queryParams = [];
    let whereClause = '';

    //判断是否查询收藏项目
    if(favorite){
      sqlQuery = 'SELECT DISTINCT u.id, u.res_name, u.user_name, u.install_dir, u.platforms, u.short_desc, u.version, u.author, u.like_count, u.favorite_count, u.download, u.res_zip_size, u.price_type, u.price_value, u.res_type, u.image_path, u.create_time, u.ext_option FROM upload_resources u INNER JOIN project_favorite_records pfr ON u.id = pfr.project_id ';
      whereClause += `pfr.user_id = ${userId} AND pfr.type > 0 AND `;
    }
    //判断是否查询点赞项目
    if(likes){
      sqlQuery = 'SELECT DISTINCT u.id, u.res_name, u.user_name, u.install_dir, u.platforms, u.short_desc, u.version, u.author, u.like_count, u.favorite_count, u.download, u.res_zip_size, u.price_type, u.price_value, u.res_type, u.image_path, u.create_time, u.ext_option FROM upload_resources u INNER JOIN user_like_records ulr ON u.id = ulr.project_id ';
      whereClause += `ulr.user_id = ${userId} AND ulr.type > 0 AND `;
    }

    if(!favorite&&!likes){
      //指定用户
      whereClause += `u.user_id = ${userId} AND `;
    }

    if (!isadmin) {
      whereClause += 'u.state = 1 AND ';
    }

    if (searchKeyword) {
      whereClause += '(u.res_name LIKE ? OR u.short_desc LIKE ?) AND ';
      queryParams.push(`%${searchKeyword}%`);
      queryParams.push(`%${searchKeyword}%`);
    }
    // 处理系统筛选
    if (filters.system && filters.system != "") {
      const Platforms = filters.system;
      whereClause += `u.platforms = ? AND `;
      queryParams.push(Platforms);
    }

    //处理类型筛选
    if (resType && resType != "") {
      whereClause += `u.res_type = ? AND `;
      queryParams.push(resType);
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
      // 确保 filterValues 是数组
      const valuesArray = Array.isArray(filterValues) ? filterValues : [filterValues];
      if (valuesArray.length > 0) {
        const uniqueFilterValues = Array.from(new Set(valuesArray));
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
    } else if (orderType === 4) {
      orderStr = ' ORDER BY favorite_count DESC';
    }

    sqlQuery += orderStr + ' LIMIT ?, 16'; // 添加排序和分页限制
    queryParams.push(loadedCount);

    const marketData = await pool.query(sqlQuery, queryParams);
    marketData.map(item => {
      item.ext_option = JSON.parse(JSON.parse(item["ext_option"])["filterData"]);
    });
    const responseData = {
      marketData: marketData
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching market list:", error);
    res.status(500).json({ error: "Server error" });
  }
}

//访客界面市场代表作品
const getGuestMarketRepresentative = async (req, res) => {
  try {
    const userId = req.query.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 3;

    // 查询 upload 表中的代表作品（软件项目）
    const uploadQuery = `
      SELECT 
        id, 
        plugin_name as name, 
        user_name, 
        description, 
        image_path, 
        like_count, 
        favorite_count, 
        download, 
        create_time,
        0 as res_type,
        (like_count + favorite_count + download) / 3 as avg_score
      FROM upload 
      WHERE user_id = ? AND state = 1
    `;

    // 查询 upload_resources 表中的代表作品（资源项目）
    const resourcesQuery = `
      SELECT 
        id, 
        res_name as name, 
        user_name, 
        short_desc as description, 
        image_path, 
        like_count, 
        favorite_count, 
        download, 
        create_time,
        res_type,
        (like_count + favorite_count + download) / 3 as avg_score
      FROM upload_resources 
      WHERE user_id = ? AND state = 1
    `;

    // 合并查询并按平均分排序
    const combinedQuery = `
      (
        ${uploadQuery}
      )
      UNION ALL
      (
        ${resourcesQuery}
      )
      ORDER BY avg_score DESC, create_time DESC
      LIMIT ?
    `;

    const representativeWorks = await pool.query(combinedQuery, [userId, userId, limit]);

    representativeWorks.forEach((work) => {
      work.create_time = formatDate(work.create_time);
    });

    const responseData = {
      representativeWorks: representativeWorks
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching guest market representative:", error);
    res.status(500).json({ error: "Server error" });
  }
}

// 获取更新信息（非强制更新）
const getUpdateInfo = async (req, res) => {
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
  try {
    let update = await readConfig("app_info_cfg_update");
    if (update) {
      if (compareVersions(update.version, version) == 1) {
        return res.json({
          msg: 'success',
          code: 200,
          data: update
        });
      }else{
        return res.json({
          msg: 'no update',
          code: 500,
        });
      }
    }
    return res.json({
      msg: 'no update',
      code: 500,
    });
  } catch (error) {
    console.error("Error fetching update info:", error);
    res.status(500).json({ error: "Server error" });
  }
}
//前端个人中心 企业更新修改
const updateEnterprise = async (req,res) => {
  try {
    const userId = req.user_id;
    const userEmail = req.user_email;
    const {
      name,
      description,
      creditCode,
      legalPersonName,
      bankcard,
      bankname
    } = req.body;

    // 参数验证
    if (!name || !creditCode || !legalPersonName) {
      return res.status(400).json({
        code: 400,
        message: '企业名称、统一社会信用代码和法人姓名不能为空'
      });
    }

    // 检查用户是否为企业创建者
    const userEnterprise = await pool.query(
      'SELECT entity_id FROM business_entity_members WHERE user_id = ? AND role = 0 AND join_status = 1',
      [userId]
    );

    if (userEnterprise.length === 0) {
      return res.status(403).json({
        code: 403,
        message: '您不是企业创建者，无权修改企业信息'
      });
    }

    const entityId = userEnterprise[0].entity_id;

    // 获取现有企业信息
    const existingEntity = await pool.query(
      'SELECT business_license_url, id_card_front_url, id_card_back_url FROM business_entities WHERE id = ?',
      [entityId]
    );

    if (existingEntity.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '企业信息不存在'
      });
    }

    // 检查统一社会信用代码是否被其他企业使用
    const duplicateEntity = await pool.query(
      'SELECT COUNT(*) as count FROM business_entities WHERE credit_code = ? AND id != ?',
      [creditCode, entityId]
    );

    if (duplicateEntity[0].count > 0) {
      return res.status(400).json({
        code: 400,
        message: '该统一社会信用代码已被其他企业注册'
      });
    }

    // 获取用户姓名
    const userInfo = await pool.query(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );
    const userName = userInfo.length > 0 ? userInfo[0].username : '';

    // 处理上传的文件
    let businessLicenseUrl = existingEntity[0].business_license_url;
    let idCardFrontUrl = existingEntity[0].id_card_front_url;
    let idCardBackUrl = existingEntity[0].id_card_back_url;

    // 创建用户目录
    const fs = require('fs');
    const { mkdir } = require('fs').promises;
    let userDir = './userinfo/' + userId + "/";
    if (!fs.existsSync(userDir)) {
      try {
        await mkdir(userDir, { recursive: true });
      } catch (error) {
        console.error("Failed to create user directory:", error);
        return res.status(400).json({
          code: 400,
          message: 'Failed to create user directory'
        });
      }
    }

    // 上传营业执照
    if (req.files && req.files.businessLicense) {
      let businessLicenseImage = userDir + 'EnterpriseBusinessLicense.png';
      let businessLicenseObj = req.files.businessLicense;
      businessLicenseObj.mv(businessLicenseImage, async (err) => {
        if(err){
          console.error("Upload business license error:" + businessLicenseImage);
        }
      });
      businessLicenseUrl = userId + '/' + "EnterpriseBusinessLicense.png";
    }
    
    // 上传法人身份证正面
    if (req.files && req.files.idCardFront) {
      let idCardFrontImage = userDir + 'EnterpriseLegalPersonIdFront.png';
      let idCardFrontObj = req.files.idCardFront;
      idCardFrontObj.mv(idCardFrontImage, async (err) => {
        if(err){
          console.error("Upload id card front error:" + idCardFrontImage);
        }
      });
      idCardFrontUrl = userId + '/' + "EnterpriseLegalPersonIdFront.png";
    }
    
    // 上传法人身份证反面
    if (req.files && req.files.idCardBack) {
      let idCardBackImage = userDir + 'EnterpriseLegalPersonIdBack.png';
      let idCardBackObj = req.files.idCardBack;
      idCardBackObj.mv(idCardBackImage, async (err) => {
        if(err){
          console.error("Upload id card back error:" + idCardBackImage);
        }
      });
      idCardBackUrl = userId + '/' + "EnterpriseLegalPersonIdBack.png";
    }

    // 更新企业信息
    const updateResult = await pool.query(
      `UPDATE business_entities SET 
        name = ?, description = ?, credit_code = ?, legal_person_name = ?,
        bank_card = ?, bank_name = ?, business_license_url = ?, 
        id_card_front_url = ?, id_card_back_url = ?, 
        status = 0, submit_date = NOW()
      WHERE id = ?`,
      [
        name, description, creditCode, legalPersonName,
        bankcard, bankname, businessLicenseUrl, 
        idCardFrontUrl, idCardBackUrl, entityId
      ]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        code: 500,
        message: '更新企业信息失败'
      });
    }

    // 同时更新成员表中的企业名称
    await pool.query(
      'UPDATE business_entity_members SET entity_name = ? WHERE entity_id = ?',
      [name, entityId]
    );

    res.json({
      code: 200,
      message: '企业信息更新成功，等待重新审核',
      data: {
        entityId: entityId,
        entityName: name,
        status: 0 // 重新提交审核
      }
    });

  } catch (error) {
    console.error('更新企业失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新企业失败，请稍后重试'
    });
  }
}
//前端个人中心 企业创建
const createEnterprise = async (req,res) => {
  try {
    const userId = req.user_id;
    const userEmail = req.user_email;
    const {
      name,
      description,
      creditCode,
      legalPersonName,
      bankcard,
      bankname
    } = req.body;

    // 参数验证
    if (!name || !creditCode || !legalPersonName) {
      return res.status(400).json({
        code: 400,
        message: '企业名称、统一社会信用代码和法人姓名不能为空'
      });
    }

    // 检查用户是否已创建或加入企业
    const existingMember = await pool.query(
      'SELECT COUNT(*) as count FROM business_entity_members WHERE user_id = ? AND join_status = 1',
      [userId]
    );

    if (existingMember[0].count > 0) {
      return res.status(400).json({
        code: 400,
        message: '您已加入企业，无法重复创建'
      });
    }

    // 检查统一社会信用代码是否已存在
    const existingEntity = await pool.query(
      'SELECT COUNT(*) as count FROM business_entities WHERE credit_code = ?',
      [creditCode]
    );

    if (existingEntity[0].count > 0) {
      return res.status(400).json({
        code: 400,
        message: '该统一社会信用代码已被注册'
      });
    }

    // 生成企业代码
    const { generateEnterpriseCode } = require('../utils/utils');
    const entityCode = generateEnterpriseCode();

    // 获取用户姓名
    const userInfo = await pool.query(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );
    const userName = userInfo.length > 0 ? userInfo[0].username : '';

    // 处理上传的文件
    let businessLicenseUrl = null;
    let idCardFrontUrl = null;
    let idCardBackUrl = null;

    // 创建用户目录
    const fs = require('fs');
    const { mkdir } = require('fs').promises;
    let userDir = './userinfo/' + userId + "/";
    if (!fs.existsSync(userDir)) {
      try {
        await mkdir(userDir, { recursive: true });
      } catch (error) {
        console.error("Failed to create user directory:", error);
        return res.status(400).json({
          code: 400,
          message: 'Failed to create user directory'
        });
      }
    }

    // 上传营业执照
    if (req.files && req.files.businessLicense) {
      let businessLicenseImage = userDir + 'EnterpriseBusinessLicense.png';
      let businessLicenseObj = req.files.businessLicense;
      businessLicenseObj.mv(businessLicenseImage, async (err) => {
        if(err){
          console.error("Upload business license error:" + businessLicenseImage);
        }
      });
      businessLicenseUrl = userId + '/' + "EnterpriseBusinessLicense.png";
    }
    
    // 上传法人身份证正面
    if (req.files && req.files.idCardFront) {
      let idCardFrontImage = userDir + 'EnterpriseLegalPersonIdFront.png';
      let idCardFrontObj = req.files.idCardFront;
      idCardFrontObj.mv(idCardFrontImage, async (err) => {
        if(err){
          console.error("Upload id card front error:" + idCardFrontImage);
        }
      });
      idCardFrontUrl = userId + '/' + "EnterpriseLegalPersonIdFront.png";
    }
    
    // 上传法人身份证反面
    if (req.files && req.files.idCardBack) {
      let idCardBackImage = userDir + 'EnterpriseLegalPersonIdBack.png';
      let idCardBackObj = req.files.idCardBack;
      idCardBackObj.mv(idCardBackImage, async (err) => {
        if(err){
          console.error("Upload id card back error:" + idCardBackImage);
        }
      });
      idCardBackUrl = userId + '/' + "EnterpriseLegalPersonIdBack.png";
    }

    // 插入企业信息
    const insertResult = await pool.query(
      `INSERT INTO business_entities (
        name, code, description, credit_code, legal_person_name,
        status, submit_date, creator_id, creator_name, creator_email,
        bank_card, bank_name, business_license_url, id_card_front_url, id_card_back_url,
        member_count
      ) VALUES (?, ?, ?, ?, ?, 0, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name, entityCode, description, creditCode, legalPersonName,
        userId, userName, userEmail,
        bankcard, bankname, businessLicenseUrl, idCardFrontUrl, idCardBackUrl
      ]
    );

    const entityId = insertResult.insertId;

    // 将创建者添加到成员表
    await pool.query(
      `INSERT INTO business_entity_members (
        entity_id, entity_code, entity_name, user_id, user_name, user_email,
        role, join_date, join_status
      ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), 1)`,
      [entityId, entityCode, name, userId, userName, userEmail]
    );

    res.json({
      code: 200,
      message: '企业创建成功，等待审核',
      data: {
        entityId: entityId,
        entityCode: entityCode,
        entityName: name,
        status: 0 // 待审核
      }
    });

  } catch (error) {
    console.error('创建企业失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建企业失败，请稍后重试'
    });
  }
}
//前端个人中心 加入企业
const joinEnterprise = async (req,res) => {
  try {
    const { enterpriseCode } = req.body;
    const userId = req.user_id;
    const userEmail = req.user_email;

    // 参数验证
    if (!enterpriseCode) {
      return res.status(400).json({
        code: 400,
        message: '企业代码不能为空'
      });
    }

    //检测用户是否完善个人信息
    const user = await pool.query('SELECT 1 FROM users_info WHERE user_id = ? AND state = 3', [userId]);
    if (user.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '请完善个人信息'
      });
    }

    // 检查用户是否已加入企业
    const existingMember = await pool.query(
      'SELECT COUNT(*) as count FROM business_entity_members WHERE user_id = ? AND join_status = 1',
      [userId]
    );

    if (existingMember[0].count > 0) {
      return res.status(400).json({
        code: 400,
        message: '您已加入企业，无法重复加入'
      });
    }

    // 查询企业信息
    const enterprise = await pool.query(
      'SELECT id, name, code, status FROM business_entities WHERE code = ?',
      [enterpriseCode]
    );

    if (enterprise.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '企业代码不存在'
      });
    }

    if (enterprise[0].status !== 1) {
      return res.status(400).json({
        code: 400,
        message: '该企业尚未通过审核，无法加入'
      });
    }

    // 获取用户姓名
    const userInfo = await pool.query(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );

    const userName = userInfo.length > 0 ? userInfo[0].username : '';

    // 申请加入企业
    await pool.query(
      `INSERT INTO business_entity_members 
       (entity_id, entity_code, entity_name, user_id, user_name, user_email, role, join_date) 
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [enterprise[0].id, enterprise[0].code, enterprise[0].name, userId, userName, userEmail]
    );

    // // 更新企业成员数量
    // await pool.query(
    //   `UPDATE business_entities 
    //    SET member_count = (SELECT COUNT(*) FROM business_entity_members WHERE entity_id = ? AND join_status = 1) 
    //    WHERE id = ?`,
    //   [enterprise[0].id, enterprise[0].id]
    // );

    res.json({
      code: 200,
      message: '成功申请加入企业，等待审核',

      data: {
        enterpriseName: enterprise[0].name,
        enterpriseCode: enterprise[0].code
      }
    });

  } catch (error) {
    console.error('加入企业失败:', error);
    res.status(500).json({
      code: 500,
      message: '加入企业失败，请稍后重试'
    });
  }
}
//前端个人中心 退出企业
const quitEnterprise = async (req,res) => {
  try {
    const userId = req.user_id;
    const { reason } = req.body; // 退出原因

    // 查询用户当前加入的企业
    const memberInfo = await pool.query(
      `SELECT m.*, e.name as enterprise_name, e.creator_id 
       FROM business_entity_members m 
       JOIN business_entities e ON m.entity_id = e.id 
       WHERE m.user_id = ? AND m.join_status = 1`,
      [userId]
    );

    if (memberInfo.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '您尚未加入任何企业'
      });
    }

    const member = memberInfo[0];

    // 检查是否为企业创建者
    if (member.creator_id === userId) {
      return res.status(400).json({
        code: 400,
        message: '企业创建者无法退出企业，请先转让企业或解散企业'
      });
    }

    // 更新成员状态为申请退出（join_status = 2 表示申请退出）
    await pool.query(
      `UPDATE business_entity_members 
       SET join_status = 2, updated_at = NOW() 
       WHERE user_id = ? AND join_status = 1`,
      [userId]
    );

    // 记录退出申请日志（可选，如果需要审核流程）
    if (reason) {
      await pool.query(
        `INSERT INTO business_entity_audit_logs 
         (entity_id, entity_code, entity_name, audit_type, old_status, new_status, audit_reason, created_at,auditor_id,auditor_name) 
         VALUES (?, ?, ?, 3, 1, 2, ?, NOW(),?,?)`,
        [member.entity_id, member.entity_code, member.enterprise_name, `用户申请退出：${reason}`, userId, req.user_name]
      );
    }

    res.json({
      code: 200,
      message: '退出企业申请已提交，等待审核',
      data: {
        enterpriseName: member.enterprise_name,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('申请退出企业失败:', error);
    res.status(500).json({
      code: 500,
      message: '申请退出企业失败，请稍后重试'
    });
  }
}
//前端个人中心 获取企业信息
const getEnterpriseInfo = async (req,res) => {
  try {
    const userId = req.user_id;

    // 查询用户当前加入的企业信息
    const memberInfo = await pool.query(
      `SELECT 
         m.role, m.join_date, m.join_status,
         e.id as enterprise_id, e.name, e.code, e.description,
         e.credit_code, e.legal_person_name, e.status as enterprise_status,e.business_license_url,e.id_card_front_url,e.id_card_back_url,
         e.creator_id, e.creator_name, e.member_count, e.created_at,e.audit_date,e.bank_card,e.bank_name,e.reject_reason,
         CASE WHEN e.creator_id = ? THEN 1 ELSE 0 END as is_creator
       FROM business_entity_members m 
       JOIN business_entities e ON m.entity_id = e.id 
       WHERE m.user_id = ? AND m.join_status IN (0, 1, 2)`,
      [userId, userId]
    );

    if (memberInfo.length === 0) {
      return res.json({
        code: 200,
        message: '获取企业信息成功',
        data: {
          hasEnterprise: false,
          enterprise: null
        }
      });
    }

    const enterprise = memberInfo[0];

    // 获取企业成员列表（如果是创建者或管理员）
    let members = [];
    if (enterprise.is_creator || enterprise.role === 0) {
      const memberList = await pool.query(
        `SELECT user_id, user_name, user_email, role, join_date, join_status
         FROM business_entity_members 
         WHERE entity_id = ? 
         ORDER BY role ASC, join_date ASC`,
        [enterprise.enterprise_id]
      );
      members = memberList;
    }

    res.json({
      code: 200,
      message: '获取企业信息成功',
      data: {
        hasEnterprise: true,
        enterprise: {
          id: enterprise.enterprise_id,
          name: enterprise.name,
          code: enterprise.code,
          description: enterprise.description,
          creditCode: enterprise.credit_code,
          legalPersonName: enterprise.legal_person_name,
          status: enterprise.enterprise_status,
          creatorName: enterprise.creator_name,
          memberCount: enterprise.member_count,
          createdAt: formatDateTimeSync(enterprise.created_at),
          auditAt: enterprise.audit_date?formatDateTimeSync(enterprise.audit_date):'',
          creatorId: enterprise.creator_id,
          creatorName: enterprise.creator_name,
          bankcard: enterprise.bank_card,
          bankname: enterprise.bank_name,
          rejectReason: enterprise.reject_reason,
          isCreator: enterprise.is_creator === 1,
          
          // 企业证件信息
          businessLicenseUrl: enterprise.business_license_url,
          idCardFrontUrl: enterprise.id_card_front_url,
          idCardBackUrl: enterprise.id_card_back_url
        },
        userRole: {
          role: enterprise.role,
          joinDate: enterprise.join_date,
          joinStatus: enterprise.join_status
        },
        members: members.map(member => ({
          userId: member.user_id,
          userName: member.user_name,
          userEmail: member.user_email,
          role: member.role,
          joinDate: member.join_date,
          joinStatus: member.join_status
        }))
      }
    });

  } catch (error) {
    console.error('获取企业信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取企业信息失败，请稍后重试'
    });
  }
}

module.exports = { 
  info,
  upload,
  uploadV2,
  uploadRes,
  marketList,
  marketResourcesList,
  marketListUser,
  marketResourcesListUser,
  getMarketComment,//用户市场获取评论
  getCommentMsgList,//用户获取评论消息列表
  getLikeMsgList,//用户获取点赞消息列表
  publishMarketComment,//用户市场发布评论
  likeMarketComment,//用户市场评论点赞
  uploadMarketCommentImage,//评论图片上传
  deleteMarketComment,//用户市场删除评论
  deleteCommentMsg,//用户删除评论消息
  reportMarketComment,//用户市场举报评论
  getMarketCommentUserData,//用户市场评论获取用户数据
  getGuestUserInfo,//用户市场评论进入访客页面
  getGuestMarketRepresentative,//访客界面市场代表作品
  download,
  authAliOss,
  updateTagSql,
  marketAppInfo,
  authOneTowThereePan,
  downloadTemp,
  marketResInfo,
  downloadRes,
  collectProject,//前端用户对项目收藏
  likeProject,//前端用户对项目点赞
  downloadResTemp,
  authAliOssRes,
  authOneTowThereePanRes,
  getMarketDetail,// 获取首页发布时获取项目详情
  getUserInfo,//前端个人中心初始用户信息
  getPersonalInfo,//前端个人中心 个人信息
  updatePersonalInfo,//前端个人中心 修改个人信息
  getPersonalInfoDetail,//前端个人中心 个人信息 详细信息
  updatePersonalInfoDetail,//前端个人中心 修改个人信息 详细信息
  checkPersonalInfoPassword,//前端个人中心 获取个人信息 详细信息 验证密码
  getUserDownloadRecord,//前端个人中心 获取用户下载记录
  deleteDownloadRecord,//前端个人中心 下载记录数据删除
  getUserFavoritesRecord,//前端个人中心 获取用户收藏记录
  getUserDeviceInfo,//前端个人中心 获取用户设备信息
  deleteUserDeviceInfo,//前端个人中心 删除用户设备信息
  getIncomeInfo,//前端个人中心 收益中心
  getWalletInfo,//前端个人中心 钱包中心
  getDiscountInfo,//前端个人中心 优惠中心
  getDiscountApplyList,//前端个人中心 获取优惠申请列表
  discountApply,//前端个人中心 优惠申请
  getInviteInfo,//前端个人中心 获取邀请码相关信息
  setInviteCode,//前端个人中心 邀请码生成
  setInviteCodeCustom,//前端个人中心 用户邀请码自定义生成
  bindInviteCode,//前端个人中心 邀请码绑定
  withdraw,//前端个人中心 钱包提现
  getWithdrawType, //前端个人中心 用户提现类型列表
  getBuyRecord, //前端个人中心 购买记录
  getUserAuditStatus,//前端获取个人详细信息审核状态
  getUpdateInfo,// 前端获取更新信息（非强制更新）
  authOneTowThereePanUpdate, //授权123网盘下载 更新新版本
  //======================企业部分======================
  updateEnterprise,//前端个人中心 企业信息修改
  createEnterprise,//前端个人中心 企业创建
  joinEnterprise,//前端个人中心 加入企业
  quitEnterprise,//前端个人中心 退出企业
  getEnterpriseInfo,//前端个人中心 获取企业信息
}
