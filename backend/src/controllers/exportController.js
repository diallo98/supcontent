const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const exportUserData = async (req, res) => {
  const userId = req.user.userId;
  const format = req.query.format || 'json'; // json ou csv

  try {
    const [ratings, reviews, lists, following, followers] = await Promise.all([
      prisma.rating.findMany({
        where: { userId },
        include: { media: { select: { title: true, tmdbId: true } } }
      }),
      prisma.review.findMany({
        where: { userId },
        include: { media: { select: { title: true, tmdbId: true } } }
      }),
      prisma.list.findMany({
        where: { userId },
        include: { items: { include: { media: { select: { title: true, tmdbId: true } } } } }
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { username: true } } }
      }),
      prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { username: true } } }
      }),
    ]);

    const data = {
      ratings: ratings.map(r => ({
        title: r.media?.title,
        tmdbId: r.mediaId,
        score: r.score,
        date: r.createdAt,
      })),
      reviews: reviews.map(r => ({
        title: r.media?.title,
        tmdbId: r.mediaId,
        content: r.content,
        date: r.createdAt,
      })),
      lists: lists.map(l => ({
        name: l.name,
        createdAt: l.createdAt,
        movies: l.items.map(i => ({ title: i.media?.title, tmdbId: i.mediaId })),
      })),
      following: following.map(f => f.following.username),
      followers: followers.map(f => f.follower.username),
    };

    if (format === 'csv') {
      const lines = ['type,title,tmdbId,score,content,date'];

      data.ratings.forEach(r => {
        lines.push(`rating,"${r.title}",${r.tmdbId},${r.score},,${r.date}`);
      });
      data.reviews.forEach(r => {
        const content = r.content.replace(/"/g, '""');
        lines.push(`review,"${r.title}",${r.tmdbId},,"${content}",${r.date}`);
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="supcontent-export.csv"');
      return res.send(lines.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="supcontent-export.json"');
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { exportUserData };