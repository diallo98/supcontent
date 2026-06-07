const express = require('express');
const router = express.Router();
const { createList, getListsByUser, addMovieToList, deleteList, getMyLists, updateList, searchPublicLists } = require('../controllers/listController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, createList);
router.get('/me', authenticateToken, getMyLists);
router.get('/public', searchPublicLists);
router.get('/user/:userId', getListsByUser);
router.post('/:listId/movies', authenticateToken, addMovieToList);
router.put('/:listId', authenticateToken, updateList);
router.delete('/:listId', authenticateToken, deleteList);

module.exports = router;