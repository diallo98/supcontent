const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur SUPCONTENT API ' })
})

// Port
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})

module.exports = app