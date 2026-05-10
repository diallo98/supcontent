const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const passport = require('../middlewares/passport')
const { register, login } = require('../controllers/authController')

router.post('/register', register)
router.post('/login', login)

// Lancer la connexion Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// Callback après connexion Google
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    // Redirige vers le frontend avec le token
    res.redirect(`http://localhost:5173?token=${token}`)
  }
)

module.exports = router