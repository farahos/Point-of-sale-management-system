import express from 'express';
import {
  generateSalesReport,
  generateProductsReport,
  generateRepairsReport,
  generateCombinedReport,
  getSavedReports,
  getReportById,
  deleteReport
} from '../controller/reportController.js';

const router = express.Router();

// Report generation routes
router.get('/sales', generateSalesReport);
router.get('/products', generateProductsReport);
router.get('/repairs', generateRepairsReport);
router.get('/combined', generateCombinedReport);

// Saved reports management
router.route('/')
  .get(getSavedReports);

router.route('/:id')
  .get(getReportById)
  .delete(deleteReport);

export default router;