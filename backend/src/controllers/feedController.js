const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/feed — activités des personnes que je suis
const getFeed = async (req, res) => {
  const userId = req.user.userId;
  const skip = parseInt(req.query.skip || 0);
  const take = 24;

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return res.json({ activities: [], hasMore: false });
    }

    const activities = await prisma.activity.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      skip,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    const hasMore = activities.length > take;
    const sliced = activities.slice(0, take);

    // Résoudre les médias concernés
    const mediaIds = [...new Set(sliced.filter(a => a.targetType === 'media').map(a => a.targetId))];
    const medias = mediaIds.length > 0
      ? await prisma.media.findMany({
          where: { id: { in: mediaIds } },
          select: { id: true, tmdbId: true, title: true, posterPath: true }
        })
      : [];
    const mediaMap = Object.fromEntries(medias.map(m => [m.id, m]));

    // Résoudre les utilisateurs cibles (cas "followed")
    const targetUserIds = [...new Set(sliced.filter(a => a.targetType === 'user').map(a => a.targetId))];
    const targetUsers = targetUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: targetUserIds } },
          select: { id: true, username: true }
        })
      : [];
    const userMap = Object.fromEntries(targetUsers.map(u => [u.id, u]));

    const enriched = sliced.map(a => ({
      id: a.id,
      actionType: a.actionType,
      targetType: a.targetType,
      targetId: a.targetId,
      createdAt: a.createdAt,
      user: a.user,
      media: a.targetType === 'media' ? mediaMap[a.targetId] || null : null,
      targetUser: a.targetType === 'user' ? userMap[a.targetId] || null : null
    }));

    return res.json({ activities: enriched, hasMore });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getFeed };