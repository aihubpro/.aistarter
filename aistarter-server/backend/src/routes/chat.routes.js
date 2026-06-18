const router = require('express').Router();
const controller = require('../controllers/chat.controller');
const midd = require('../middleware/index');

// 获取聊天消息历史
router.get('/history', [midd.jwt.tokenRequired], controller.getChatHistory);

// 获取联系人列表
router.get('/contacts', [midd.jwt.tokenRequired], controller.getContacts);

// 软删除联系人
router.post('/delete-contact', [midd.jwt.tokenRequired], controller.deleteContact);

// 创建或获取聊天
router.post('/create-chat', [midd.jwt.tokenRequired], controller.createOrGetChat);

// 删除聊天消息
router.post('/delete-message', [midd.jwt.tokenRequired], controller.deleteChatMessage);

// 获取用户在线状态
router.get('/online-status', [midd.jwt.tokenRequired], controller.getUserOnlineStatus);

// 获取未读消息数
router.get('/unread-count', [midd.jwt.tokenRequired], controller.getUnreadMessageCount);

module.exports = router; 