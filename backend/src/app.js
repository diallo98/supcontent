const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const rateLimit = require('express-rate-limit')
const passport = require('./middlewares/passport')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const mediaRoutes = require('./routes/mediaRoutes')
const ratingRoutes = require('./routes/ratingRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const listRoutes = require('./routes/listRoutes')
const feedRoutes = require('./routes/feedRoutes')
const watchStatusRoutes = require('./routes/watchStatusRoutes')
const commentRoutes = require('./routes/commentRoutes')
const likeRoutes = require('./routes/likeRoutes')
const messageRoutes = require('./routes/messageRoutes')
const moderationRoutes = require('./routes/moderationRoutes') // ← Ligne ajoutée
const notificationRoutes = require('./routes/notificationRoutes')
const exportRoutes = require('./routes/exportRoutes');

dotenv.config()

const app = express()

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
app.use('/api/ratings', ratingRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/lists', listRoutes)
app.use('/api/feed', feedRoutes)
app.use('/api/watchstatus', watchStatusRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/likes', likeRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/moderation', moderationRoutes) // ← Ligne ajoutée
app.use('/api/notifications', notificationRoutes)
app.use('/api/export', exportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur SUPCONTENT API' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur lance sur le port ${PORT}`)
})

module.exports = app