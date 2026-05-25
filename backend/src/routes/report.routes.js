const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/report.controller');

router.use(authenticate);
router.get('/sales.pdf', authorize('admin'), ctrl.salesPdf);
router.get('/sales.xlsx', authorize('admin'), ctrl.salesExcel);
router.get('/inventory.xlsx', authorize('admin'), ctrl.inventoryExcel);
router.get('/invoice/:id.pdf', ctrl.invoicePdf);

module.exports = router;
