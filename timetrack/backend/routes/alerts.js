const router = require('express').Router();
const ctrl = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAlerts);
router.post('/', ctrl.createAlert);
router.patch('/:id/read', ctrl.markRead);
router.patch('/mark-all-read', ctrl.markAllRead);

module.exports = router;
