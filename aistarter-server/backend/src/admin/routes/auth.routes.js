const router = require('express').Router()
const controller = require('../controllers/auth.controllers')
// const midd = require('../../middleware/index')

router.post('/adminLogin',[], controller.adminLogin)

module.exports = router
