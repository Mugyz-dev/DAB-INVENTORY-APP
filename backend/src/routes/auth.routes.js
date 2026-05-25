const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/register',
  body('full_name').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be 8 to 100 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must include a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must include a number'),
  body('confirm_password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  validate, ctrl.register);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  validate, ctrl.login);

router.get('/me', authenticate, ctrl.me);

module.exports = router;
