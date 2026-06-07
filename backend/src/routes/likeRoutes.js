const express = require('express')
const router = express.Router()
const { toggleLike, getLikes } = require('../controllers/likeController')
const { authenticateToken } = require('../middlewares/auth')

router.get('/:reviewId', authenticateToken, getLikes)
router.post('/:reviewId', authenticateToken, toggleLike)

module.exports = router