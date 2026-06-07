const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Récupérer toutes les notifications de l'utilisateur connecté
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    })
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Marquer toutes les notifications comme lues
const markAllRead = async (req, res) => {
  try {
    const userId = req.user.userId
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })
    res.json({ message: 'Notifications marquées comme lues.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Compter les notifications non lues
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId
    const count = await prisma.notification.count({
      where: { userId, read: false }
    })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Fonction utilitaire pour créer une notification (appelée depuis d'autres controllers)
const createNotification = async (userId, type, message) => {
  try {
    await prisma.notification.create({
      data: { userId, type, message }
    })
  } catch (err) {
    console.error('Erreur notification:', err.message)
  }
}

module.exports = { getNotifications, markAllRead, getUnreadCount, createNotification }