const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate, isAdmin);
router.get('/dashboard', ctrl.getDashboard);
router.get('/live-sessions', ctrl.getLiveSessions);
router.get('/analytics', ctrl.getAnalytics);

module.exports = router;
