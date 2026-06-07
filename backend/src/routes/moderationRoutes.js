const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middlewares/auth')
const {
  reportReview,
  requireAdmin,
  getReports,
  deleteReview,
  dismissReport,
  banUser,
  featureReview
} = require('../controllers/moderationController')

// Route utilisateur : signaler une critique
router.post('/reports/review/:reviewId', authenticateToken, reportReview)

// Routes admin
router.get('/reports', authenticateToken, requireAdmin, getReports)
router.delete('/reports/:reportId', authenticateToken, requireAdmin, dismissReport)
router.delete('/reviews/:reviewId', authenticateToken, requireAdmin, deleteReview)
router.put('/users/:userId/ban', authenticateToken, requireAdmin, banUser)
router.put('/reviews/:reviewId/feature', authenticateToken, requireAdmin, featureReview)

module.exports = router