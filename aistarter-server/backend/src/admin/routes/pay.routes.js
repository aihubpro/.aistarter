const router = require('express').Router()
const controller = require('../controllers/pay.controller')
const midd = require('../../middleware/index')
const checkServerStatus = require('../../middleware/check_server_status')


//获取支付渠道信息
router.get('/getPayChannel', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getPayChannel)
//获取支付配置
router.get('/getPayChannelConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getPayChannelConfig)
//更新支付配置
router.post('/updatePayChannelConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updatePayChannelConfig)

//生成异步通知地址
router.get('/generateNotifyUrl', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.generateNotifyUrl)
//支付通知(微信)
router.post('/wechatPayNotify', [], controller.wechatPayNotify)
//支付通知(支付宝)
router.post('/alipayPayNotify', [], controller.alipayPayNotify)

//获取支付平台配置
router.get('/getPayPlatformConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getPayPlatformConfig)
//更新支付平台配置
router.post('/updatePayPlatformConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updatePayPlatformConfig)

//获取支付平台设置V2（更详细信息）
router.get('/getPayPlatformConfigV2', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getPayPlatformConfigV2)
//更新支付平台配置V2
router.post('/updatePayPlatformConfigV2', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updatePayPlatformConfigV2)

//获取共创者支付配置信息
router.get('/getCoPayConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCoPayConfig)
//更新共创者支付配置信息
router.post('/updateCoPayConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.updateCoPayConfig)

//获取消息限制配置信息
router.get('/getMessageLimitConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getMessageLimitConfig)
//更新消息限制配置信息
router.post('/updateMessageLimitConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.updateMessageLimitConfig)

//获取税收配置
router.get('/getTaxConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getTaxConfig)
//更新税收配置
router.post('/updateTaxConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateTaxConfig)


module.exports = router
