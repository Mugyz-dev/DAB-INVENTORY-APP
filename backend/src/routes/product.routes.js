const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/product.controller');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/low-stock', ctrl.lowStock);
router.get('/:id', ctrl.get);

router.post('/', authorize('admin'),
  body('sku').trim().isLength({ min: 2, max: 50 }),
  body('name').trim().isLength({ min: 2, max: 200 }),
  body('selling_price').isFloat({ min: 0 }),
  validate, ctrl.create);

router.put('/:id', authorize('admin'),
  body('sku').trim().isLength({ min: 2, max: 50 }),
  body('name').trim().isLength({ min: 2, max: 200 }),
  validate, ctrl.update);

router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
