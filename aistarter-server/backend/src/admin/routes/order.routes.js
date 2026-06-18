const router = require('express').Router()
const controller = require('../controllers/order.controller')
const midd = require('../../middleware/index')
const checkServerStatus = require('../../middleware/check_server_status')

//获取订单列表
router.get('/getPayOrderList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getPayOrderList)
//====================优惠管理====================
//获取优惠码待审核列表
router.get('/getDiscountApplyList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getDiscountApplyList)
//保存优惠码待审核列表
router.post('/saveDiscountApplyList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.saveDiscountApplyList)
//设置订单备注
router.post('/saveOrderDescription', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.saveOrderDescription)
//更新优惠码审核状态
router.post('/updateDiscountApplyStatus', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateDiscountApplyStatus)
//删除申请优惠码数据
router.post('/deleteDiscountApply', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.deleteDiscountApply)
//获取优惠码列表
router.get('/getCouponList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCouponList)
//保存优惠码列表
router.post('/saveCouponList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.saveCouponList)
//批量保存优惠码列表 根据id
router.post('/batchEditByGroupCoupon', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.batchEditByGroupCoupon)
//批量保存优惠码列表
router.post('/saveCouponListBatch', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.saveCouponListBatch)
//====================提现订单====================
//获取提现列表
router.get('/getWithdrawList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getWithdrawList)
//审核提现订单
router.post('/auditWithdrawOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.auditWithdrawOrder)
//====================收益核验====================
//获取收益核验列表
router.get('/getUserOrderList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getUserOrderList)
//获取月订单
router.get('/getLastMonthOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getLastMonthOrder)
//批量删除月订单
router.post('/deleteLastMonthOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.deleteLastMonthOrder)
//删除收益核验记录
router.post('/deleteUserOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.delUserOrder)
//批量删除收益核验记录
router.post('/delUserOrderBatch', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.delUserOrderBatch)
//收益核验审核通过
router.post('/passUserOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.passUserOrder)
//批量收益核验审核通过
router.post('/batchPassUserOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.batchPassUserOrder)
//收益核验匹配审核通过
router.post('/batchAuditUserOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.batchAuditUserOrder)
//修改收益核验订单
router.post('/editUserOrder', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.editUserOrder)

module.exports = router
