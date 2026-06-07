const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const upsertRating = async (req, res) => {
  const { mediaId, score } = req.body;
  const userId = req.user.userId;

  if (!mediaId || score === undefined) {
    return res.status(400).json({ error: 'mediaId et score sont requis' });
  }
  if (score < 0 || score > 10) {
    return res.status(400).json({ error: 'Le score doit être entre 0 et 10' });
  }

  try {
    // Crée le Media s'il n'existe pas encore
    const media = await prisma.media.upsert({
      where: { tmdbId: mediaId },
      update: {},
      create: { tmdbId: mediaId, title: `Film ${mediaId}` },
    });

    const rating = await prisma.rating.upsert({
      where: { userId_mediaId: { userId, mediaId: media.id } },
      update: { score },
      create: { userId, mediaId: media.id, score },
    });

    return res.status(200).json(rating);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getRatingStats = async (req, res) => {
  const tmdbId = parseInt(req.params.mediaId);

  try {
    const media = await prisma.media.findUnique({ where: { tmdbId } });
    if (!media) return res.json({ mediaId: tmdbId, average: null, count: 0 });

    const result = await prisma.rating.aggregate({
      where: { mediaId: media.id },
      _avg: { score: true },
      _count: { score: true },
    });

    return res.json({
      mediaId: tmdbId,
      average: result._avg.score,
      count: result._count.score,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { upsertRating, getRatingStats };