const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middlewares/auth')
const { getNotifications, markAllRead, getUnreadCount } = require('../controllers/notificationController')

router.use(authenticateToken)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.put('/mark-read', markAllRead)

module.exports = router