const pool = require('../database')
const jwt = require('jsonwebtoken')
const config = require("../config")
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer');
const crypto = require('crypto-js');

//是否有权限查看未审核的列表
const isAdmin = async (token) => {

  // console.log(token);

  if (!token || token == "") {
    return false;
  }

  try {
    const { id, id_role } = jwt.verify(token, config.JWT_SECTET_KEY)

    // console.log("id_role:" + id_role);

    if(id_role == 1){
      return true;
    }

    return false;
  } catch (error) {
    // console.log(error);
    return false;
  }
}

//获取授权字符串
const getLoginToken = async (id, email, username, id_role) => {
  return jwt.sign({ id, email, username, id_role }, config.JWT_SECTET_KEY, { expiresIn: 86400 * 360 })
}

//格式日期
const formatDateTimeSync = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以加1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

//获取密码加密串
const getPasswordEncrypt = async (password) => {
  const salt = await bcrypt.genSalt(10)
  const passwordEncrypt = await bcrypt.hash(password, salt)
  return passwordEncrypt;
}

//确认密码验证
const verifyPassword = async (password, hashPassword) => {
  return await bcrypt.compare(password, hashPassword)
}

// 发送邮件的方法
const sendMail = async (mail, subject, text) => {
  // 发件邮箱配置: 请替换为你的 SMTP 服务信息
  // QQ邮箱: host=smtp.qq.com, port=465, secure=true
  // SMTP_PASS 不是QQ密码，是QQ邮箱设置中生成的"授权码"
  let formEmail = "__SMTP_USER_PLACEHOLDER__"; //发送邮箱地址
  try {
    // 创建SMTP传输器
    const transporter = nodemailer.createTransport({
        service: "qq", // 服务商
        host: "__SMTP_HOST_PLACEHOLDER__",
        secure: "__SMTP_SECURE_PLACEHOLDER__" === "true", // true for 465, false for other ports
        auth: {
            user: formEmail, // 发件人邮箱
            pass: '__SMTP_PASS_PLACEHOLDER__' // 发件人邮箱密码或应用程序密码
        }
    });

    // 设置邮件选项
    const mailOptions = {
        from: formEmail,
        to: mail,
        subject: subject,
        text: text
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true; // 发送成功
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// 更具token获取用户信息
const userInfoByToken = async (token) => {

  if (!token || token == "") {
    return null;
  }

  try {
    const { id,email,id_role,username } = jwt.verify(token, config.JWT_SECTET_KEY)
    let ret = {};
    ret.user_id = id
    ret.user_email = email
    ret.user_role = id_role;
    ret.user_name = username;

    const exist = await pool.query('SELECT * FROM users WHERE id = ?', [id])

    if (!exist.length) {
      return null;
    }

    return ret;
  } catch (error) {
    console.error('token not valid:' + error);
    return false;
  }
}

//123网盘链接签名
const oneTwoThreePanSignURL = async (originURL, privateKey, uid, validDuration) => {
  const ts = Math.floor((Date.now() + validDuration) / 1000); // 有效时间戳，单位：秒
  const rInt = Math.floor(Math.random() * 1000000); // 随机正整数，这里生成一个最大值为1000000的随机整数
  const objURL = new URL(originURL);
  const authKey = `${ts}-${rInt}-${uid}-${crypto
    .MD5(`${decodeURIComponent(objURL.pathname)}-${ts}-${rInt}-${uid}-${privateKey}`)
    .toString()}`;
  objURL.searchParams.append('auth_key', authKey);
  return objURL.toString();
}

/**
 * 判断请求端的操作系统类型
 * @param {Object} req - Express 请求对象
 * @returns {string} - 返回操作系统类型（如 'Windows', 'macOS', 'Unknown'）
 */
function detectOperatingSystem(req) {
  // 获取 User-Agent 头
  const userAgentString = req.headers['user-agent'];

  if (!userAgentString) {
      return null; // 如果没有 User-Agent，默认返回 Unknown
  }

  // 判断操作系统
  if (/Windows/.test(userAgentString)) {
      return 'win';
  } else if (/Mac OS/.test(userAgentString)) {
      return 'macos';
  } else if (/Linux/.test(userAgentString)) {
    return 'linux';
  } else {
      return null; // 未知操作系统
  }
}

module.exports = { 
  isAdmin,
  formatDateTimeSync,
  getLoginToken,
  getPasswordEncrypt,
  verifyPassword,
  sendMail,
  userInfoByToken,
  oneTwoThreePanSignURL,
  detectOperatingSystem
}