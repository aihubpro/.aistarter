const router = require('express').Router()
const controller = require('../controllers/order.controller')
const midd = require('../middleware/index')

//检测项目是否购买
router.get('/check-is-buy', [midd.jwt.tokenRequired], controller.checkIsBuy)
//检测资源是否购买
router.get('/check-res-is-buy', [midd.jwt.tokenRequired], controller.checkResIsBuy)

module.exports = router
