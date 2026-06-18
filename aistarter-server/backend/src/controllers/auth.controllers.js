const pool = require('../database')
const { getLoginToken, getPasswordEncrypt, verifyPassword, sendMail } = require('../helpers/functions')
const { checkSendingFrequency, cleanExpiredRecords, generateEmailCode, recordEmailCode, deleteEmailCodeRecord, verifyEmailCode} = require('../helpers/verification')

const controller = {}

controller.signUp = async (req, res) => {
  const {email, password, code, username,inviteCode} = req.body

  const verifyResult = verifyEmailCode(email, code);
  if (!verifyResult.success) {
    res.status(400).json({ error: verifyResult.error });
    return;
  }

  //数据验证
  const regUserName = /^[a-zA-Z0-9]{3,20}$/;
  if(!regUserName.test(username)){
    res.status(400).json({ error:"Username error!!" })
    return
  }

  const passwordEncrypt = await getPasswordEncrypt(password);

  const user = {
    username,
    email,
    country:"",
    phone:"",
    password: passwordEncrypt,
    machine_code_change_count: 0,  // 添加默认值
    reason: ""  // 添加 reason 字段默认值
  }

  if (inviteCode) { //邀请码存在则判断是否有效
    const inviteCodeResult = await pool.query('SELECT invite_code FROM users WHERE invite_code = ?', [inviteCode]);
    if (inviteCodeResult.length === 0) {
      res.status(400).json({ error: 'Invalid invite code' });
      return;
    }
    if(inviteCodeResult[0].invite_code){
      user.parent_invite_code = inviteCodeResult[0].invite_code;
    }
  }

  user.id_role = 2


  try {
    const insertResult = await pool.query('INSERT INTO users set ?', [user]);
    const userId = insertResult.insertId;
    // 插入users_info表
    await pool.query('INSERT INTO users_info set ?', [{ user_id: userId }]);
    res.status(200).json({ message: 'user added successfully' })
  } catch (error) {
    console.log(error)
    res.status(400).json({ error:"database error" })
  }
}

controller.signIn = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = ?', [
      email
    ])

    if (!user.length) {
      return res.status(400).json({ error: 'Email not registered' })
    }

    const { id, password: userPassword,id_role,username } = user[0]
    const isVerifyPassword = await verifyPassword(password, userPassword)

    if (!isVerifyPassword) {
      return res.status(400).json({ error: 'Invalid password' })
    }

    const token = await getLoginToken(id, email, username, id_role);

    res.status(200).json({ token })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error:"database error" })
  }
}


//发送邮件验证码
controller.sendMailCode = async (req, res) => {

  const {email} = req.body

  // 检查是否在一分钟内已发送过验证码
  if(!checkSendingFrequency(email)){
    res.status(400).json({ error:"sending too frequently!" });
    return;
  }

  //清理过期的记录
  cleanExpiredRecords();

  let toEmail = email; //接收邮箱地址
  let emailCode = generateEmailCode(); //生成的验证码

  console.log("email code:" + email + " -> " + emailCode)

  //记录验证码
  recordEmailCode(email, emailCode);


  let isSendSucc = await sendMail(toEmail, 'AI Starter Email Verification', "Your verification code is " + emailCode + ", valid for 5 minutes. Please do not disclose it to others!")
  if(isSendSucc){
    res.status(200).json({
      data: 'Sent Successfuly'
    });
  }else{
    res.status(400).json({ error:"Failed to send verification email" });

    deleteEmailCodeRecord(email);

  }

}

module.exports = controller
