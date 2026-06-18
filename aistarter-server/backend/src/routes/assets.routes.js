const router = require('express').Router()
const controller = require('../controllers/assets.controller')
const midd = require('../middleware/index')

//检测项目是否购买
router.get('/market-images/:userId/:fileName', [], controller.marketImages)

router.get('/market-images/:resource/:userId/:fileName', [], controller.marketResImages)

router.get('/user-images/:userId/:fileName', [], controller.userImages)

router.get('/user-comment-images/:userId/:fileName', [], controller.userCommentImages)


module.exports = router
