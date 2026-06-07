require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { createNotification } = require('./notificationController')

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
        role: true,
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
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouve' })
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

// Suivre un utilisateur
const followUser = async (req, res) => {
  try {
    const followerId = req.user.userId
    const followingId = parseInt(req.params.id)

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-meme' })
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    })

    if (existing) {
      return res.status(400).json({ error: 'Vous suivez deja cet utilisateur' })
    }

    await prisma.follow.create({
      data: { followerId, followingId }
    })

    await prisma.activity.create({
      data: {
        userId: followerId,
        actionType: 'followed',
        targetType: 'user',
        targetId: followingId
      }
    })

    // Notifier l'utilisateur suivi
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true }
    })
    await createNotification(
      followingId,
      'follow',
      `${follower.username} a commence a vous suivre.`
    )

    res.json({ message: 'Utilisateur suivi avec succes' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Ne plus suivre un utilisateur
const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.userId
    const followingId = parseInt(req.params.id)

    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } }
    })

    res.json({ message: 'Vous ne suivez plus cet utilisateur' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const searchUsers = async (req, res) => {
  const { q } = req.query
  if (!q?.trim()) return res.json([])

  try {
    const users = await prisma.user.findMany({
      where: {
        username: { contains: q.trim(), mode: 'insensitive' }
      },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        _count: { select: { followers: true } }
      },
      take: 20
    })
    return res.json(users)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

const getFollowers = async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, avatarUrl: true } } }
    })
    res.json(follows.map(f => f.follower))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

const getFollowing = async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, avatarUrl: true } } }
    })
    res.json(follows.map(f => f.following))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

module.exports = { getProfile, getUserById, updateProfile, followUser, unfollowUser, searchUsers, getFollowers, getFollowing }