const pool = require('../database')

const existEmail = async (req, res, next) => {
  const { email,username } = req.body

  //验证邮箱或者用户名是否已存在
  const tmpUsername = username.toLowerCase();
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = ? OR LOWER(username) = ?', [
      email, tmpUsername
    ]);
  
    if (user.length > 0) {
      // 检查邮箱是否已存在
      const emailExists = user.some(row => row.email === email);
      if (emailExists) {
        return res.status(400).json({ error: "The email has been used!" });
      }else{
        
        return res.status(400).json({ error: "The username has been used!" });
      }

    }

    next()
  
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Database error" });
  }

}

const existRole = async (req, res, next) => {
  const { role: queryRole } = req.body

  if (!queryRole) {
    return next()
  }

  try {
    const roles = await pool.query('SELECT * FROM roles')
    const exist = roles.filter(({ role }) => role === queryRole).length

    if (exist) {
      return next()
    }

    return res.status(400).json({ error: 'role not valid' })
  } catch (error) {
    return res.status(400).json({ error })
  }
}

module.exports = { existEmail, existRole }
