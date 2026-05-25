const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/supplier.controller');

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', authorize('admin'),
  body('name').trim().isLength({ min: 2, max: 150 }),
  body('email').optional({ checkFalsy: true }).isEmail(),
  validate, ctrl.create);
router.put('/:id', authorize('admin'),
  body('name').trim().isLength({ min: 2, max: 150 }),
  validate, ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
