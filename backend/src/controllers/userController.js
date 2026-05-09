require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Voir son propre profil
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            reviews: true
          }
        }
      }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Voir le profil d'un autre utilisateur
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            reviews: true
          }
        }
      }
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Modifier son profil
const updateProfile = async (req, res) => {
  try {
    const { username, bio, avatarUrl } = req.body

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { username, bio, avatarUrl },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true
      }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getProfile, getUserById, updateProfile }