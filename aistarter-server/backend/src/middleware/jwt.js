const jwt = require('jsonwebtoken')
const pool = require('../database')
const config = require("../config")
const { getserverStatusText } = require('../helpers/license')
// const { isAdmin } = require('../helpers/functions')

const tokenRequired = async (req, res, next) => {
  const token = req.headers['access-token']
  //获取判断是否共创者续费
  const renew = req.headers['access-renew'];

  if (!token) {
    return res.status(400).json({ error: 'token required' })
  }

  try {
    const { id,email,id_role,username } = jwt.verify(token, config.JWT_SECTET_KEY)
    req.user_id = id
    req.user_email = email
    req.user_role = id_role;
    req.user_name = username;
    if (renew) { //续费 如果是共创者续费的话，就需要判断最初始的邮箱是否对上，只能是指定邮箱续费
      const renew = await pool.query('SELECT * FROM users WHERE email =?', [email])
      if(renew.length == 0){ //用户不存在
        return res.status(400).json({ error: 'token unassigned' })
      }
      req.user_id = renew[0].id
      req.user_role = renew[0].id_role;
      req.user_name = renew[0].username;
      return next()
    }

    const exist = await pool.query('SELECT * FROM users WHERE id = ?', [id])

    if (!exist.length) {
      return res.status(400).json({ error: 'token unassigned' })
    }
    req.phone = exist[0].phone //获取用户手机号
    return next()
  } catch (error) {
    return res.status(400).json({ error: 'token not valid' })
  }
}
//验证token判断用户是否封禁
const tokenRequiredCheckBan = async (req, res, next) => {
   try {
    const token = req.headers['access-token']
    if (!token) {
      return res.status(400).json({ error: 'token unassigned' })
    }
    const { id } = jwt.verify(token, config.JWT_SECTET_KEY)
    const exist = await pool.query('SELECT * FROM users WHERE id = ?', [id])
    if (!exist.length) { //用户不存在
      return res.status(400).json({ error: 'token unassigned' })
    }
    //判断用户是否处于禁用状态
    if ((exist[0].status == 1 && exist[0].ban_expire_time > Date.now()) || exist[0].status == 2) {
      return res.status(400).json({ error: 'user banned' })
    }
    return next()
  } catch (error) {
    return res.status(400).json({ error: 'token not valid' })
  }
}
//验证token但不返回报错
const tokenRequiredNoErr = async (req, res, next) => {
  try {
    const token = req.headers['access-token']
    if (!token) {
      return next() //正常返回不记录req用户信息
    }
    const { id,email,id_role,username } = jwt.verify(token, config.JWT_SECTET_KEY)
    const exist = await pool.query('SELECT * FROM users WHERE id = ?', [id])
    if (!exist.length) { //用户不存在
      return next() //正常返回不记录req用户信息
    }
    req.user_id = id
    req.user_email = email
    req.user_role = id_role;
    req.user_name = username;
    return next()
  } catch (error) {
    return res.status(400).json({ error: 'token not valid' })
  }
}

const tokenAdmin = async (req, res, next) => {

  if( req.user_role != 1){
    return res.json({ msg: 'token not valid', code:-1 })
  }
  if(config.IS_PARENT){
    return next()
  }
  const status = await getserverStatusText()
  if (status >= 2) { //服务器状态 0:正常 1:过期 2:异常 3:封禁 4:软件更新到主公司 异常即以上状态不允许登录
    return res.json({ msg: 'Server is not active', code: -1 })
  }

  return next()
}

// const sameUser = async (req, res, next) => {
//   const id = Number(req.params.id)

//   try {
//     const admin = await isAdmin(req.user_id)

//     if (req.user_id === id || admin) {
//       return next()
//     }

//     return res.status(400).json({ error: 'You do not have permissions to manage documents that are not owned by you' })
//   } catch (error) {
//     return res.status(400).json({ error })
//   }
// }

module.exports = { tokenRequired, tokenAdmin,tokenRequiredNoErr,tokenRequiredCheckBan}
