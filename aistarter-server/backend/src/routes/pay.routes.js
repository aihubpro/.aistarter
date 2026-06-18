const router = require('express').Router()
const controller = require('../controllers/pay.controller')
const midd = require('../middleware/index')

//获取订阅信息
router.get('/vip-price', [], controller.vipPrice)
//获取订阅详细信息
router.get('/vip-price-V2', [], controller.vipPriceV2)
// 共创者获取续费列表接口
router.get('/getCoRenewList', [], controller.coPayPrice)
//获取支付订单
router.get('/getPayOrder', [midd.jwt.tokenRequired], controller.getPayOrder)
//查询订单
router.get('/checkPayOrder', [midd.jwt.tokenRequired], controller.checkPayOrder)
//前端获取支付类型列表
router.get('/getPayTypeList', [], controller.getPayTypeList)

//paypal支付成功返回的界面
router.get('/paypalReturn', [], controller.paypalReturn)
//paypal支付取消返回的界面
router.get('/paypalCancel', [], controller.paypalCancel)

//stripe支付成功返回的界面
router.get('/stripeSuccess', [], controller.stripeSuccess)
//stripe支付取消返回的界面
router.get('/stripeCancel', [], controller.stripeCancel)
//stripe webhook处理
router.post('/stripeWebhook', [], controller.stripeWebhook)


//余额支付
router.post('/balancePay', [midd.jwt.tokenRequired], controller.balancePay)

module.exports = router
