const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/feed — activités des personnes que je suis
const getFeed = async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1. Récupérer les IDs des personnes que je suis
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return res.json({ activities: [], message: 'Tu ne suis personne encore' });
    }

    // 2. Récupérer leurs activités récentes
    const activities = await prisma.activity.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, username: true } }
      }
    });

    return res.json({ activities });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getFeed };