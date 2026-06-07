const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer ou créer une conversation entre deux utilisateurs
const getOrCreateConversation = async (req, res) => {
  const userId = parseInt(req.user.userId); // 1ère occurrence modifiée
  const targetUserId = parseInt(req.params.targetUserId);

  // Validation stricte des deux IDs
  if (isNaN(userId) || isNaN(targetUserId)) {
    return res.status(400).json({ error: 'ID utilisateur invalide.' });
  }

  const user1Id = Math.min(userId, targetUserId);
  const user2Id = Math.max(userId, targetUserId);

  try {
    let conversation = await prisma.conversation.findFirst({
      where: { user1Id, user2Id },
      include: {
        user1: { select: { id: true, username: true, avatarUrl: true } },
        user2: { select: { id: true, username: true, avatarUrl: true } },
      }
    });

    if (!conversation) {
      // Vérifier qu'ils se suivent mutuellement
      const mutualFollow = await prisma.follow.findFirst({
        where: { followerId: userId, followingId: targetUserId }
      });
      const mutualFollow2 = await prisma.follow.findFirst({
        where: { followerId: targetUserId, followingId: userId }
      });

      if (!mutualFollow || !mutualFollow2) {
        return res.status(403).json({ error: 'Vous devez vous suivre mutuellement pour envoyer un message.' });
      }

      conversation = await prisma.conversation.create({
        data: { user1Id, user2Id },
        include: {
          user1: { select: { id: true, username: true, avatarUrl: true } },
          user2: { select: { id: true, username: true, avatarUrl: true } },
        }
      });
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer tous les messages d'une conversation
const getMessages = async (req, res) => {
  const userId = req.user.userId; // 2ème occurrence modifiée
  const { conversationId } = req.params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) }
    });

    if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Envoyer un message
const sendMessage = async (req, res) => {
  const userId = req.user.userId; // 3ème occurrence modifiée
  const { conversationId } = req.params;
  const { content } = req.body;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) }
    });

    if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        conversationId: parseInt(conversationId)
      },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } }
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer toutes les conversations de l'utilisateur connecté
const getMyConversations = async (req, res) => {
  const userId = req.user.userId; // 4ème occurrence modifiée

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }]
      },
      include: {
        user1: { select: { id: true, username: true, avatarUrl: true } },
        user2: { select: { id: true, username: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getOrCreateConversation, getMessages, sendMessage, getMyConversations };