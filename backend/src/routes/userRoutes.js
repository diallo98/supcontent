const express = require('express')
const router = express.Router()
const { getProfile, getUserById, updateProfile } = require('../controllers/userController')
const { authenticateToken } = require('../middlewares/auth')

// Routes protégées par le token JWT
router.get('/me', authenticateToken, getProfile)
router.put('/me', authenticateToken, updateProfile)
router.get('/:id', getUserById)

module.exports = router