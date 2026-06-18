const { getserverStatus } = require('../helpers/license')
const config = require('../config')

const checkServerStatus = async (req, res, next) => {
  try {
    if (config.IS_PARENT) {
      return next()
    }
    const serverstatus = await getserverStatus()
    if (serverstatus) {
      return res.json({ msg: '服务到期，请尽快续费', code: -500 })
    }
    next()
  } catch (error) {
    console.error('Error checking server status:', error)
    return res.json({ msg: '服务状态检查失败', code: -500 })
  }
}

module.exports = checkServerStatus