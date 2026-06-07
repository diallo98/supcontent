const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Signaler une critique
const reportReview = async (req, res) => {
  try {
    const reporterId = req.user.userId
    const reviewId = parseInt(req.params.reviewId)
    const { reason } = req.body

    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Une raison est requise.' })
    }

    const existing = await prisma.report.findFirst({
      where: { reporterId, reviewId }
    })

    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà signalé cette critique.' })
    }

    const report = await prisma.report.create({
      data: { reporterId, reviewId, reason: reason.trim() }
    })

    res.status(201).json({ message: 'Critique signalée avec succès.', report })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Middleware admin mis à jour avec le log de débug
const requireAdmin = (req, res, next) => {
  console.log('req.user:', req.user)
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' })
  }
  next()
}

// Lister tous les signalements
const getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, username: true } },
        review: {
          include: {
            user: { select: { id: true, username: true } },
            media: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Supprimer une critique signalée
const deleteReview = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId)
    await prisma.review.delete({ where: { id: reviewId } })
    res.json({ message: 'Critique supprimée.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Ignorer un signalement
const dismissReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId)
    await prisma.report.delete({ where: { id: reportId } })
    res.json({ message: 'Signalement ignoré.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Bannir un utilisateur
const banUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'banned' }
    })
    res.json({ message: 'Utilisateur banni.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Mettre en avant une critique
const featureReview = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId)
    await prisma.review.update({
      where: { id: reviewId },
      data: { featured: true }
    })
    res.json({ message: 'Critique mise en avant.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { reportReview, requireAdmin, getReports, deleteReview, dismissReport, banUser, featureReview }