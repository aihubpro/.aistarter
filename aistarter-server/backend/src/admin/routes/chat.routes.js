const router = require('express').Router()
const controller = require('../controllers/chat.controller')
const midd = require('../../middleware/index')
const checkServerStatus = require('../../middleware/check_server_status')

// 获取聊天数据列表
router.get('/getChatList', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getChatList)

// 获取聊天统计数据
router.get('/getChatStatistics', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getChatStatistics)

// 群发消息
router.post('/broadcastMessage', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin, checkServerStatus], controller.broadcastMessage)

// 获取群发记录
router.get('/getBroadcastHistory', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin], controller.getBroadcastHistory)

// 删除聊天记录
router.post('/deleteChatMessage', [midd.jwt.tokenRequired, midd.jwt.tokenAdmin, checkServerStatus], controller.deleteChatMessage)

module.exports = router