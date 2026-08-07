// sessions.js
const router = require('express').Router();
const ctrl = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getSessions);
router.get('/active', ctrl.getActiveSession);
router.get('/stats', ctrl.getStats);
router.post('/start', ctrl.startSession);
router.patch('/:id/stop', ctrl.stopSession);
router.patch('/:id/pause', ctrl.pauseSession);
router.patch('/:id/resume', ctrl.resumeSession);
router.delete('/:id', ctrl.deleteSession);

module.exports = router;
