const pool = require('../../database')
const { getLoginToken, verifyPassword } = require('../../helpers/functions')

const adminLogin = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = ?', [
      email
    ])

    if (!user.length) {
      return res.status(200).json({ code:-1001, msg: 'Email not registered' })
    }

    const { id, password: userPassword,id_role,username } = user[0]
    const isVerifyPassword = await verifyPassword(password, userPassword)

    if (!isVerifyPassword) {
      return res.status(200).json({ code:-1002, msg: 'Invalid password' })
    }

    if(id_role != 1){
      if( req.user_role != 1){
        return res.json({ msg: 'Email not registered', code:-1003 })
      }
    }

    const token = await getLoginToken(id, email, username, id_role);

    res.status(200).json({ code:0, data:token })
  } catch (error) {
    console.log(error)
    return res.status(200).json({ code:-1003, msg:"database error" })
  }
}

module.exports = {
  adminLogin
}
