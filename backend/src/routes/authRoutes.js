const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { body } = require('express-validator')
const passport = require('../middlewares/passport')
const { register, login } = require('../controllers/authController')

// Règles de validation pour le register
const registerRules = [
  body('username').notEmpty().withMessage('Le username est obligatoire'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères')
]

// Règles de validation pour le login
const loginRules = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire')
]

router.post('/register', registerRules, register)
router.post('/login', loginRules, login)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Payload mis à jour avec le rôle pour l'authentification Google
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`)
  }
)

module.exports = router