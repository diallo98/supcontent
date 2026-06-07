const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { createNotification } = require('./notificationController')

const getComments = async (req, res) => {
  const reviewId = parseInt(req.params.reviewId)
  try {
    const comments = await prisma.comment.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, username: true } } }
    })
    return res.json(comments)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

const createComment = async (req, res) => {
  const reviewId = parseInt(req.params.reviewId)
  const { content } = req.body
  const userId = req.user.userId

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Le commentaire ne peut pas etre vide' })
  }

  try {
    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId, reviewId },
      include: { user: { select: { id: true, username: true } } }
    })

    // Notifier l'auteur de la critique
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true }
    })

    if (review && review.userId !== userId) {
      await createNotification(
        review.userId,
        'comment',
        `${comment.user.username} a commente votre critique.`
      )
    }

    return res.status(201).json(comment)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

const deleteComment = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId

  try {
    const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } })
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' })
    if (comment.userId !== userId) return res.status(403).json({ error: 'Non autorise' })

    await prisma.comment.delete({ where: { id: parseInt(id) } })
    return res.json({ message: 'Commentaire supprime' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

module.exports = { getComments, createComment, deleteComment }