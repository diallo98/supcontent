const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une liste (Prise en compte de isPublic)
const createList = async (req, res) => {
  const { name, isPublic = true } = req.body;
  const userId = req.user.userId;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Le nom de la liste est requis' });
  }

  try {
    const list = await prisma.list.create({
      data: { userId, name: name.trim(), isPublic }
    });
    return res.status(201).json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir les listes d'un utilisateur
const getListsByUser = async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const lists = await prisma.list.findMany({
      where: { userId },
      include: { items: true }
    });
    return res.json(lists);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Ajouter un film à une liste
const addMovieToList = async (req, res) => {
  const listId = parseInt(req.params.listId)
  const { mediaId } = req.body
  const userId = req.user.userId

  try {
    const list = await prisma.list.findUnique({ where: { id: listId } })
    if (!list) return res.status(404).json({ error: 'Liste introuvable' })
    if (list.userId !== userId) return res.status(403).json({ error: 'Non autorisé' })

    // Crée le Media s'il n'existe pas encore
    const media = await prisma.media.upsert({
      where: { tmdbId: mediaId },
      update: {},
      create: { tmdbId: mediaId, title: `Film ${mediaId}` },
    })

    const item = await prisma.listItem.create({
      data: { listId, mediaId: media.id }
    })
    return res.status(201).json(item)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ce film est déjà dans la liste' })
    }
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Supprimer une liste
const deleteList = async (req, res) => {
  const listId = parseInt(req.params.listId);
  const userId = req.user.userId;

  try {
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) return res.status(404).json({ error: 'Liste introuvable' });
    if (list.userId !== userId) return res.status(403).json({ error: 'Non autorisé' });

    await prisma.list.delete({ where: { id: listId } });
    return res.json({ message: 'Liste supprimée' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir les listes de l'utilisateur connecté
const getMyLists = async (req, res) => {
  const userId = req.user.userId;
  try {
    const lists = await prisma.list.findMany({
      where: { userId },
      include: { 
        items: { 
          include: { 
            media: { select: { tmdbId: true, title: true, posterPath: true } } 
          } 
        } 
      }
    });
    return res.json(lists);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateList = async (req, res) => {
  const listId = parseInt(req.params.listId)
  const { isPublic } = req.body
  const userId = req.user.userId

  try {
    const list = await prisma.list.findUnique({ where: { id: listId } })
    if (!list) return res.status(404).json({ error: 'Liste introuvable' })
    if (list.userId !== userId) return res.status(403).json({ error: 'Non autorisé' })

    const updated = await prisma.list.update({
      where: { id: listId },
      data: { isPublic }
    })
    return res.json(updated)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

module.exports = { createList, getListsByUser, addMovieToList, deleteList, getMyLists, updateList };
