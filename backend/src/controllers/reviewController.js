const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createReview = async (req, res) => {
  const { mediaId, content } = req.body;
  const userId = req.user.userId;

  if (!mediaId || !content?.trim()) {
    return res.status(400).json({ error: 'mediaId et content sont requis' });
  }

  try {
    // Crée le Media s'il n'existe pas encore
    const media = await prisma.media.upsert({
      where: { tmdbId: mediaId },
      update: {},
      create: { tmdbId: mediaId, title: `Film ${mediaId}` },
    });

    const existing = await prisma.review.findFirst({
      where: { userId, mediaId: media.id }
    });
    if (existing) {
      return res.status(409).json({ error: 'Tu as déjà écrit une review pour ce film' });
    }

    const review = await prisma.review.create({
      data: { userId, mediaId: media.id, content: content.trim() },
      include: { user: { select: { id: true, username: true } } }
    });

    return res.status(201).json(review);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getReviewsByMovie = async (req, res) => {
  const tmdbId = parseInt(req.params.mediaId);

  try {
    const media = await prisma.media.findUnique({ where: { tmdbId } });
    if (!media) return res.json([]);

    const reviews = await prisma.review.findMany({
      where: { mediaId: media.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true } } }
    });

    return res.json(reviews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteReview = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const review = await prisma.review.findUnique({ where: { id: parseInt(id) } });
    if (!review) return res.status(404).json({ error: 'Review introuvable' });
    if (review.userId !== userId) return res.status(403).json({ error: 'Non autorisé' });

    await prisma.review.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Review supprimée' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { createReview, getReviewsByMovie, deleteReview };