const express = require('express')
const router = express.Router()
const { getProfile, getUserById, updateProfile, followUser, unfollowUser } = require('../controllers/userController')
const { authenticateToken } = require('../middlewares/auth')

router.get('/me', authenticateToken, getProfile)
router.put('/me', authenticateToken, updateProfile)
router.get('/:id', getUserById)
router.post('/:id/follow', authenticateToken, followUser)
router.delete('/:id/follow', authenticateToken, unfollowUser)

module.exports = router