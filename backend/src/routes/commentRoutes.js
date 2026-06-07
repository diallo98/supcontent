const express = require('express')
const router = express.Router()
const { getComments, createComment, deleteComment } = require('../controllers/commentController')
const { authenticateToken } = require('../middlewares/auth')

router.get('/:reviewId', getComments)
router.post('/:reviewId', authenticateToken, createComment)
router.delete('/:id', authenticateToken, deleteComment)

module.exports = router