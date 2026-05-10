const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const rateLimit = require('express-rate-limit')
const passport = require('./middlewares/passport')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const mediaRoutes = require('./routes/mediaRoutes')

dotenv.config()

const app = express()

// Limite les requêtes sur les routes auth à 20 par 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' }
})

app.use(cors())
app.use(express.json())
app.use(passport.initialize())

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/movies', mediaRoutes)

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur SUPCONTENT API 🎬' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})

module.exports = app