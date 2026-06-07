const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getMyConversations
} = require('../controllers/messageController');

router.use(authenticateToken);

router.get('/', getMyConversations);
router.get('/with/:targetUserId', getOrCreateConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);

module.exports = router;