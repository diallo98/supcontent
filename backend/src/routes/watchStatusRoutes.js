const express = require('express')
const router = express.Router()
const { upsertWatchStatus, getMyWatchStatus, getMyLibrary } = require('../controllers/watchStatusController')
const { authenticateToken } = require('../middlewares/auth')

router.post('/', authenticateToken, upsertWatchStatus)
router.get('/me', authenticateToken, getMyLibrary)
router.get('/movie/:mediaId', authenticateToken, getMyWatchStatus)

module.exports = router