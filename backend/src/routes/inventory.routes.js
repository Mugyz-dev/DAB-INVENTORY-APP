const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/inventory.controller');

router.use(authenticate);
router.get('/', authorize('admin'), ctrl.list);
router.post('/', authorize('admin'), ctrl.move);

module.exports = router;
