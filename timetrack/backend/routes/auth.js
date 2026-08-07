const router = require('express').Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', [
  body('name').trim().notEmpty().isLength({min:2,max:100}),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({min:6}).matches(/^(?=.*[A-Za-z])(?=.*\d)/),
], validate, ctrl.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, ctrl.login);

router.post('/forgot-password', [body('email').isEmail()], validate, ctrl.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({min:6}),
], validate, ctrl.resetPassword);

router.get('/me', authenticate, ctrl.getMe);

router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({min:6}),
], validate, ctrl.changePassword);

module.exports = router;
