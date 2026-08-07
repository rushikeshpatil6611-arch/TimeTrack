const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getSettings);
router.put('/', isAdmin, ctrl.updateSettings);

module.exports = router;
