const express = require('express')
const router = express.Router()
const { 
  getProfile, 
  getUserById, 
  updateProfile, 
  followUser, 
  unfollowUser, 
  searchUsers, 
  getFollowers, 
  getFollowing,
  updateAvatar
} = require('../controllers/userController')
const { authenticateToken } = require('../middlewares/auth')
const upload = require('../middlewares/upload')

router.get('/me', authenticateToken, getProfile)
router.put('/me', authenticateToken, updateProfile)
router.patch('/me/avatar', authenticateToken, upload.single('avatar'), updateAvatar)
router.get('/search', authenticateToken, searchUsers)
router.get('/:id', getUserById)
router.post('/:id/follow', authenticateToken, followUser)
router.delete('/:id/follow', authenticateToken, unfollowUser)
router.get('/:id/followers', getFollowers)
router.get('/:id/following', getFollowing)

module.exports = router