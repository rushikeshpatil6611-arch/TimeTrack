const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, isAdmin, isSelfOrAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', isAdmin, ctrl.getUsers);
router.post('/', isAdmin, ctrl.createUser);
router.get('/:id', isSelfOrAdmin, ctrl.getUser);
router.put('/:id', isSelfOrAdmin, ctrl.updateUser);
router.patch('/:id/toggle-status', isAdmin, ctrl.toggleUserStatus);
router.delete('/:id', isAdmin, ctrl.deleteUser);

module.exports = router;
