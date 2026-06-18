const router = require('express').Router()
const controller = require('../controllers/users.controller')
const midd = require('../../middleware/index')
const checkServerStatus = require('../../middleware/check_server_status')

//获取新消息未审核等……
router.get('/getNewMessage', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getNewMessage)
//获取用户信息
router.get('/getUserInfo', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getUserInfo)
// 给用户添加余额
router.post('/addBalance', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.addBalance)
//重置密码
router.post('/resetPassword', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.resetPassword)
//获取菜单
router.get('/getMenuList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getMenuList)
//获取注册用户列表
router.get('/getRegUserList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getRegUserList)
// 获取待审核个人信息的用户
router.get('/getCreativeUserList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCreativeUserList)
// 设置待审核个人信息的用户状态
router.post('/setCreativeUserState', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.setCreativeUserState)
//获取注册用户详细信息
router.get('/getUserAllInfo', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getUserAllInfo)
//解绑邀请码
router.post('/unbindParentInviteCode', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.unbindParentInviteCode)
//绑定邀请码
router.post('/bindParentInviteCode', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.bindParentInviteCode)
//更新用户状态
router.post('/updateUserState', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.updateUserState)

//获取AI项目列表
router.get('/getAIProjectList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getAIProjectList)
//获取AI项目筛选配置
router.get('/getAIProjectFilter', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getAIProjectFilter)
//更新AI项目
router.post('/updateAIProject', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateAIProject)

//删除AI项目筛选
router.get('/deleteAIProjectFilter', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.deleteAIProjectFilter)
//更新AI项目筛选配置
router.get('/updateAIProjectFilter', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateAIProjectFilter)

//上传图片
router.post('/uploadImage', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.uploadImage)

//删除AI项目
router.get('/delAIProject', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.delAIProjec)
//更新AI项目审核状态
router.get('/setProjectReviewStatus', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.setProjectReviewStatus)
//获取首页数据
router.get('/getDashBoardInfo', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getDashBoardInfo)

//获取OSS阿里平台配置
router.get('/getOssAliConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getOssAliConfig)
//更新OSS阿里平台配置
router.post('/updateOssAliConfig', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateOssAliConfig)
//获取OSS123网盘平台配置
router.get('/getOss123Config', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getOss123Config)
//更新OSS123网盘平台配置
router.post('/updateOss123Config', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateOss123Config)

//后端接口 获取更新信息
router.get('/getVersionInfo',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin],controller.getVersionInfo)
//后端接口 获取更新信息 (非强制更新)
router.get('/getVersionInfo2',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin],controller.getVersionInfo2)
//后端接口 获取轮播图信息
router.get('/getBannerInfo',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin],controller.getBannerInfo)
//修改新版本更新信息
router.post('/updateNewVersionInfo',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus],controller.updateNewVersionInfo)
//后端接口 更新更新信息 (非强制更新)
router.post('/updateNewVersionInfo2',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus],controller.updateNewVersionInfo2)
//轮播图图片上传
router.post('/bannerUpload',checkServerStatus,controller.bannerUpload)
//修改轮播图信息
router.post('/updateBannerInfo',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus],controller.updateBannerInfo)

//后端分享界面信息获取
router.get('/getShareCfg',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin],controller.getShareCfg)
//后端分享界面信息修改
router.post('/updateShareCfg',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus],controller.updateShareCfg)

//=====================临时表=======================
//获取AI项目列表
router.get('/getAIProjectListtmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getAIProjectListtmp)
//更新AI项目
router.post('/updateAIProjecttmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateAIProjecttmp)
//删除AI项目
router.get('/delAIProjecttmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.delAIProjectmp)
//更新AI项目审核状态
router.get('/setProjectReviewStatustmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.setProjectReviewStatustmp)
//上传图片
router.post('/uploadImagetmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.uploadImagetmp)

//=====================(模型，插件，工作流)=======================
//获取资源列表
router.get('/getResList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getResList)
//获取过滤器列表
router.get('/getResFilter', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getResFilter)
//更新资源
router.post('/updateRes', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateRes)
//删除过滤器
router.get('/deleteResFilter', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.deleteResFilter)
// 更新过滤器 
router.get('/updateResFilter', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateResFilter)
//删除资源 
router.get('/delRes', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.delRes)
//设置资源审核状态
router.get('/setResReviewStatus', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.setResReviewStatus)
//上传图片
router.post('/uploadImageRes', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.uploadImageRes)

//=====================(模型，插件，工作流 待审核)=======================
//获取资源列表
router.get('/getResListtmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getResListtmp)
//更新资源
router.post('/updateRestmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.updateRestmp)
//删除资源 
router.get('/delRestmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.delRestmp)
//设置资源审核状态
router.get('/setResReviewStatustmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.setResReviewStatustmp)
//上传图片
router.post('/uploadImageRestmp', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin,checkServerStatus], controller.uploadImageRestmp)

//===========================================
//========================
//===========================================



//获取新版本更新信息，以及轮播图等……
router.get('/get-app-info',controller.getAppInfo)
//前端忘记密码修改密码
router.post('/forgot-password-by-email', controller.forgotPasswordByEmail)
//前端修改密码
router.post('/update-password', [midd.jwt.tokenRequired], controller.changePassword)
//前端用户项目数据
router.get('/get-user-project-data',[midd.jwt.tokenRequired],controller.getUserProjectData)
//前端用户项目数据删除
router.post('/delete-user-project-data',[midd.jwt.tokenRequired],controller.deleteUserProjectData)
// 前端用户资源数据
router.get('/get-user-resources-data',[midd.jwt.tokenRequired],controller.getUserResourcesData)
//前端用户资源数据删除
router.post('/delete-user-resources-data',[midd.jwt.tokenRequired],controller.deleteUserResourcesData)
//前端获取用户钱包数据
router.get('/get-user-wallet-data',[midd.jwt.tokenRequired],controller.getUserWalletData)
//前端获取用户收益相关
router.get('/get-user-income-data',[midd.jwt.tokenRequired],controller.getUserIncomeData)
//前端判断项目目录是否存在
router.get('/check-project-dir',[midd.jwt.tokenRequired],controller.checkProjectDir)
// 前端判断资源目录是否存在
router.get('/check-res-dir',[midd.jwt.tokenRequired],controller.checkResDir)
//前端审核获取AI项目详情
router.get('/market-app-info-review',[midd.jwt.tokenRequired],controller.marketAppInfo)
//前端审核获取项目列表
router.get('/market-list-review',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin],controller.marketList)
//前端审核资源列表
router.get('/market-resource-list-review',[midd.jwt.tokenRequired, midd.jwt.tokenAdmin],controller.marketResList)
//前端审核获取资源详情
router.get('/market-resource-info-review',[midd.jwt.tokenRequired],controller.marketResInfo)

//============================================

//前端分享链接校验
router.get('/share', controller.checksharedlink)


//============================================共创者=========================================
//后端获取共创者列表
router.get('/getCollList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCollaboratorlist)
//共创者获取状态
router.get('/getCollStatus', [], controller.getCollaboratorStatus)
//后端编辑共创者信息
router.post('/editCollab', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.editCollab)
//后端添加共创者信息
router.post('/addCollab', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.addCollab)
//后端删除共创者信息
router.post('/delCollab', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.delCollab)
// 修改共创者状态信息
router.post('/updateCollabState', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.updateCollabState)
// 远程修改服务器状态接口（原始公司用）
router.post('/updateServerStatus', [], controller.updateServerStatus)
// 远程获取license文件接口（原始公司用）
router.post('/getLicenseFile', [], controller.getLicenseFile)
// 远程更新license文件接口（原始公司用）
router.post('/updateLicenseFile', [], controller.updateLicenseFile)
// 获取机器码（原始公司用）
router.post('/getMachineCode', [], controller.getMachineCode)
// 修改共创者相关信息接口（共创者用）
router.post('/collaboratorsetting', [], controller.collaboratorsetting)
// 获取共创者加密文件信息
router.post('/getCollabLicense', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCollabLicense) 
// 更新共创者加密文件信息
router.post('/updateCollabLicense', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.updateCollabLicense) 
// 更新共创者服务器状态
router.post('/updateCollabSeverState', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.updateCollabSeverState)
// 获取共创者机器码
router.post('/getCollabMachineCode', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCollabMachineCode)
//==========================评论举报 ===============================
//管理员获取评论举报列表
router.get('/getCommentReports', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCommentReports)
//管理员处理评论举报
router.post('/handleCommentReport', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.handleCommentReport)
//后台评论列表
router.get('/getCommentList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getCommentList)

//==========================企业管理===============================
//后台获取企业列表
router.get('/getEnterpriseList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getEnterpriseList)
//后台企业审核
router.post('/enterpriseReview', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.enterpriseReview)
//后台企业删除
router.post('/deleteEnterprise', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.deleteEnterprise)
//后台获取企业用户列表
router.get('/getEnterpriseUserList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getEnterpriseUserList)
//后台企业人员删除
router.post('/deleteEnterpriseUser', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.deleteEnterpriseUser)
//后台获取退出原因
router.post('/getQuitEnterpriseReason', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getQuitEnterpriseReason)
//后台驳回企业人员退出申请
router.post('/rejectQuitEnterprise', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.rejectQuitEnterprise)
//后台审核企业人员加入申请
router.post('/approveJoinEnterprise', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.approveJoinEnterprise)

module.exports = router
