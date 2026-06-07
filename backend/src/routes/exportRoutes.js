const express = require('express');
const router = express.Router();
const { exportUserData } = require('../controllers/exportController');
const { authenticateToken } = require('../middlewares/auth');

// GET /api/export?format=json  ou  ?format=csv
router.get('/', authenticateToken, exportUserData);

module.exports = router;