const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getCategories);
router.post('/', isAdmin, ctrl.createCategory);
router.put('/:id', isAdmin, ctrl.updateCategory);
router.delete('/:id', isAdmin, ctrl.deleteCategory);

module.exports = router;
