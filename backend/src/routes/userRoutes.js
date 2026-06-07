const express = require('express')
const router = express.Router()
// La liste des imports a été mise à jour ici :
const { 
  getProfile, 
  getUserById, 
  updateProfile, 
  followUser, 
  unfollowUser, 
  searchUsers, 
  getFollowers, 
  getFollowing 
} = require('../controllers/userController')
const { authenticateToken } = require('../middlewares/auth')

router.get('/me', authenticateToken, getProfile)
router.put('/me', authenticateToken, updateProfile)
router.get('/search', authenticateToken, searchUsers)
router.get('/:id', getUserById)
router.post('/:id/follow', authenticateToken, followUser)
router.delete('/:id/follow', authenticateToken, unfollowUser)

// Les deux routes ont été ajoutées ici :
router.get('/:id/followers', getFollowers)
router.get('/:id/following', getFollowing)

module.exports = router