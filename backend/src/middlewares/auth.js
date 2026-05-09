const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

const authRoutes = require('./routes/authRoutes')

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur SUPCONTENT API 🎬' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})

module.exports = app