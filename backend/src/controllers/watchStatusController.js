const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Définir ou mettre à jour le statut d'un film
const upsertWatchStatus = async (req, res) => {
  // Récupération des données du film fournies par le client (ex: depuis TMDB)
  const { mediaId, status, title, posterPath, runtime } = req.body
  const userId = req.user.userId

  const validStatuses = ['a_voir', 'en_cours', 'termine', 'abandonne']
  if (!mediaId || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'mediaId et status valide requis' })
  }

  try {
    const media = await prisma.media.upsert({
      where: { tmdbId: mediaId },
      update: { runtime: runtime || undefined },
      create: { 
        tmdbId: mediaId, 
        title: title || `Film ${mediaId}`,
        posterPath: posterPath || null,
        runtime: runtime || null
      },
    })

    const watchStatus = await prisma.watchStatus.upsert({
      where: { userId_mediaId: { userId, mediaId: media.id } },
      update: { status },
      create: { userId, mediaId: media.id, status },
    })

    return res.json(watchStatus)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Récupérer le statut d'un film pour l'utilisateur connecté
const getMyWatchStatus = async (req, res) => {
  const tmdbId = parseInt(req.params.mediaId)
  const userId = req.user.userId

  try {
    const media = await prisma.media.findUnique({ where: { tmdbId } })
    if (!media) return res.json({ status: null })

    const watchStatus = await prisma.watchStatus.findUnique({
      where: { userId_mediaId: { userId, mediaId: media.id } }
    })

    return res.json({ status: watchStatus?.status || null })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Récupérer toute la bibliothèque de l'utilisateur connecté (avec calcul du temps total)
const getMyLibrary = async (req, res) => {
  const userId = req.user.userId

  try {
    const statuses = await prisma.watchStatus.findMany({
      where: { userId },
      include: { media: true },
      orderBy: { updatedAt: 'desc' }
    })

    // Modification ici : Calcul du temps total passé devant les films terminés
    const totalMinutes = statuses
      .filter(s => s.status === 'termine')
      .reduce((acc, s) => acc + (s.media.runtime || 0), 0)

    // Retourne le format { items, totalMinutes } demandé
    return res.json({ items: statuses, totalMinutes })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

module.exports = { upsertWatchStatus, getMyWatchStatus, getMyLibrary }