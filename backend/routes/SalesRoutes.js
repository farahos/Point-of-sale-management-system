import express from "express";
import {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  bulkDeleteSales,
  getSalesOverview,
  getSalesReport
} from "../controller/SalesController.js";

const router = express.Router();

/**
 * @route   POST /api/sales
 * @desc    Create a new sale
 * @access  Public
 */
router.post("/", createSale);

/**
 * @route   GET /api/sales
 * @desc    Get all sales with filters
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   startDate - Filter sales from this date
 * @query   endDate - Filter sales to this date
 * @query   sortBy - Field to sort by (default: createdAt)
 * @query   sortOrder - Sort order: asc or desc (default: desc)
 */
router.get("/", getAllSales);

/**
 * @route   GET /api/sales/stats/overview
 * @desc    Get sales overview statistics
 * @access  Public
 */
router.get("/stats/overview", getSalesOverview);

/**
 * @route   GET /api/sales/report
 * @desc    Get detailed sales report
 * @access  Public
 * @query   startDate - Report start date
 * @query   endDate - Report end date
 */
router.get("/report", getSalesReport);

/**
 * @route   GET /api/sales/:id
 * @desc    Get single sale by ID
 * @access  Public
 */
router.get("/:id", getSaleById);

/**
 * @route   PUT /api/sales/:id
 * @desc    Update sale by ID
 * @access  Public
 */
router.put("/:id", updateSale);

/**
 * @route   DELETE /api/sales/:id
 * @desc    Delete single sale by ID
 * @access  Public
 */
router.delete("/:id", deleteSale);

/**
 * @route   DELETE /api/sales
 * @desc    Bulk delete sales by IDs array
 * @access  Public
 * @body    { ids: [string] } - Array of sale IDs to delete
 */
router.delete("/", bulkDeleteSales);

export default router;