const router = require('express').Router()
const controller = require('../controllers/auth.controllers')
const midd = require('../middleware/index')

router.post('/sign-up', [midd.auth.existRole, midd.auth.existEmail], controller.signUp)
router.post('/sign-in', controller.signIn)
router.post('/send-code', [], controller.sendMailCode)

module.exports = router
