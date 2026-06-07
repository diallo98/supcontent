const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { createNotification } = require('./notificationController')

const toggleLike = async (req, res) => {
  const userId = req.user.userId
  const reviewId = parseInt(req.params.reviewId)

  try {
    const existing = await prisma.reviewLike.findUnique({
      where: { userId_reviewId: { userId, reviewId } }
    })

    if (existing) {
      await prisma.reviewLike.delete({
        where: { userId_reviewId: { userId, reviewId } }
      })
      return res.json({ liked: false })
    } else {
      await prisma.reviewLike.create({
        data: { userId, reviewId }
      })

      // Notifier l'auteur de la critique
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { user: { select: { id: true, username: true } } }
      })

      if (review && review.userId !== userId) {
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true }
        })
        await createNotification(
          review.userId,
          'like',
          `${liker.username} a aime votre critique.`
        )
      }

      return res.json({ liked: true })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

const getLikes = async (req, res) => {
  const reviewId = parseInt(req.params.reviewId)
  const userId = req.user?.userId

  try {
    const count = await prisma.reviewLike.count({ where: { reviewId } })
    const liked = userId ? !!(await prisma.reviewLike.findUnique({
      where: { userId_reviewId: { userId, reviewId } }
    })) : false

    return res.json({ count, liked })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

module.exports = { toggleLike, getLikes }