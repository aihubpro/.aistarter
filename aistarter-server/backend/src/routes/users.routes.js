const router = require('express').Router()
const controller = require('../controllers/users.controller')
const midd = require('../middleware/index')

router.get('/info', [midd.jwt.tokenRequired], controller.info)
router.post('/upload', [midd.jwt.tokenRequired], controller.upload)
router.post('/upload-v2', [midd.jwt.tokenRequired], controller.uploadV2)
router.post('/upload-resources', [midd.jwt.tokenRequired], controller.uploadRes)
router.get('/market-list', [], controller.marketList)
router.get('/market-resources-list', [], controller.marketResourcesList)
router.get('/market-list-user', [], controller.marketListUser)
router.get('/market-resources-list-user', [], controller.marketResourcesListUser)
router.get('/download/:fId', [midd.jwt.tokenRequiredNoErr], controller.download)
router.get('/download-res/:fId', [midd.jwt.tokenRequiredNoErr], controller.downloadRes)
//前端用户对项目收藏
router.post('/collect-project', [midd.jwt.tokenRequired], controller.collectProject)
//前端用户对项目点赞
router.post('/like-project', [midd.jwt.tokenRequired], controller.likeProject)
//授权OSS下载
router.get('/auth-alioss', [midd.jwt.tokenRequired], controller.authAliOss)
router.get('/auth-alioss-res', [midd.jwt.tokenRequired], controller.authAliOssRes)
//临时更新sql接口
// router.get('/updateTagSql', [], controller.updateTagSql)
//获取应用详情
router.get('/market-app-info', [midd.jwt.tokenRequiredNoErr], controller.marketAppInfo)
router.get('/market-res-info', [midd.jwt.tokenRequiredNoErr], controller.marketResInfo)

//获取更新信息（非强制更新）
router.get('/get-update-info', [midd.jwt.tokenRequiredNoErr], controller.getUpdateInfo)

//用户市场获取评论
router.get('/get-market-comment', [midd.jwt.tokenRequiredNoErr], controller.getMarketComment)
//用户获取评论消息列表
router.get('/get-comment-msg-list', [midd.jwt.tokenRequired], controller.getCommentMsgList)
//用户获取点赞消息列表
router.get('/get-like-msg-list', [midd.jwt.tokenRequired], controller.getLikeMsgList)
//用户市场发布评论
router.post('/publish-market-comment', [midd.jwt.tokenRequired], controller.publishMarketComment)
//用户市场评论点赞
router.post('/like-market-comment', [midd.jwt.tokenRequired], controller.likeMarketComment)
//评论图片上传
router.post('/upload-market-comment-image', [midd.jwt.tokenRequired], controller.uploadMarketCommentImage)
//用户市场删除评论
router.post('/delete-market-comment', [midd.jwt.tokenRequired], controller.deleteMarketComment)
//用户删除评论消息
router.post('/delete-comment-msg', [midd.jwt.tokenRequired], controller.deleteCommentMsg)
//用户市场举报评论
router.post('/report-market-comment', [midd.jwt.tokenRequired], controller.reportMarketComment)
//用户市场评论获取用户数据
router.post('/get-market-comment-user-data', [midd.jwt.tokenRequiredNoErr], controller.getMarketCommentUserData)

//用户市场评论进入访客页面
router.post('/get-guest-user-info', [midd.jwt.tokenRequired], controller.getGuestUserInfo)

//访客界面市场代表作品
router.get('/get-guest-market-representative', [midd.jwt.tokenRequired], controller.getGuestMarketRepresentative)

//123网盘授权下载
router.get('/auth-123pan', [midd.jwt.tokenRequired], controller.authOneTowThereePan)
router.get('/auth-123pan-res', [midd.jwt.tokenRequired], controller.authOneTowThereePanRes)
router.get('/auth-123pan-update',[midd.jwt.tokenRequiredNoErr],controller.authOneTowThereePanUpdate)

//审核下载
router.get('/download-temp/:fId', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.downloadTemp)
router.get('/download-res-temp/:fId', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.downloadResTemp)

//首页发布项目获取项目详情
router.get('/get-market-detail', [midd.jwt.tokenRequired], controller.getMarketDetail)

//前端获取个人详细信息审核状态
router.get('/get-user-audit-status', [midd.jwt.tokenRequired], controller.getUserAuditStatus)

//前端个人中心初始用户信息
router.get('/get-user-info', [midd.jwt.tokenRequired], controller.getUserInfo)
//前端个人中心 获取个人信息
router.get('/get-personal-info', [midd.jwt.tokenRequired], controller.getPersonalInfo)
//前端个人中心 修改个人信息
router.post('/update-personal-info', [midd.jwt.tokenRequired], controller.updatePersonalInfo)
//前端个人中心 获取个人信息 详细信息
router.get('/get-personal-info-detail', [midd.jwt.tokenRequired], controller.getPersonalInfoDetail)
//前端个人中心 获取个人信息 详细信息 修改
router.post('/update-personal-info-detail', [midd.jwt.tokenRequired], controller.updatePersonalInfoDetail)
//前端个人中心 获取个人信息 详细信息 验证密码
router.post('/check-personal-info-password', [midd.jwt.tokenRequired], controller.checkPersonalInfoPassword)
//前端个人中心 获取用户下载记录
router.get('/get-user-download-record', [midd.jwt.tokenRequired], controller.getUserDownloadRecord)
//前端个人中心 下载记录数据删除
router.post('/delete-download-record', [midd.jwt.tokenRequired], controller.deleteDownloadRecord)
//前端个人中心 获取用户收藏记录
router.get('/get-user-favorites-record', [midd.jwt.tokenRequired], controller.getUserFavoritesRecord)
//前端个人中心 获取用户设备信息
router.post('/get-user-device-info', [midd.jwt.tokenRequired], controller.getUserDeviceInfo)
//前端个人中心 删除用户设备信息
router.post('/delete-user-device-info', [midd.jwt.tokenRequired], controller.deleteUserDeviceInfo)

//前端个人中心 收益中心
router.post('/get-user-income', [midd.jwt.tokenRequired], controller.getIncomeInfo)
//前端个人中心 钱包中心
router.post('/get-user-wallet', [midd.jwt.tokenRequired], controller.getWalletInfo)
//前端个人中心 优惠中心
router.post('/get-user-discount', [midd.jwt.tokenRequired], controller.getDiscountInfo)
//前端个人中心 获取优惠申请列表
router.post('/get-discount-apply-list', [midd.jwt.tokenRequired], controller.getDiscountApplyList)
//前端个人中心 优惠申请
router.post('/discount-apply', [midd.jwt.tokenRequired], controller.discountApply)
//前端个人中心 获取邀请码相关信息
router.post('/get-invite-info', [midd.jwt.tokenRequired], controller.getInviteInfo)
//前端个人中心 用户邀请码生成
router.post('/set-invite-code', [midd.jwt.tokenRequired], controller.setInviteCode)
//前端个人中心，用户邀请码自定义生成
router.post('/set-invite-code-custom', [midd.jwt.tokenRequired], controller.setInviteCodeCustom)
//前端个人中心 邀请码绑定
router.post('/bind-invite-code', [midd.jwt.tokenRequired], controller.bindInviteCode)
//前端个人中心 钱包提现
router.post('/withdraw', [midd.jwt.tokenRequired], controller.withdraw)
//前端个人中心 用户提现类型列表
router.post('/withdraw-type-info', [midd.jwt.tokenRequired], controller.getWithdrawType)
//前端个人中心 购买记录
router.post('/get-buy-record', [midd.jwt.tokenRequired], controller.getBuyRecord)

//==========================企业管理===============================
//前端个人中心 企业信息修改
router.post('/update-enterprise', [midd.jwt.tokenRequired], controller.updateEnterprise)
//前端个人中心 企业创建
router.post('/create-enterprise', [midd.jwt.tokenRequired], controller.createEnterprise)
//前端个人中心 加入企业
router.post('/join-enterprise', [midd.jwt.tokenRequired], controller.joinEnterprise)
//前端个人中心 退出企业
router.post('/quit-enterprise', [midd.jwt.tokenRequired], controller.quitEnterprise)
//前端个人中心 获取企业信息
router.get('/get-enterprise-info', [midd.jwt.tokenRequired], controller.getEnterpriseInfo)

module.exports = router
