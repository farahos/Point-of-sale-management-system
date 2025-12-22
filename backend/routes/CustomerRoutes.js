import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  getCustomerStats
} from "../controller/CustomerController.js";

const router = express.Router();

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Public
 */
router.post("/", createCustomer);

/**
 * @route   GET /api/customers
 * @desc    Get all customers with pagination, search, and sorting
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   search - Search term for name or phone
 * @query   sortBy - Field to sort by (default: createdAt)
 * @query   sortOrder - Sort order: asc or desc (default: desc)
 */
router.get("/", getAllCustomers);

/**
 * @route   GET /api/customers/stats
 * @desc    Get customer statistics
 * @access  Public
 */
router.get("/stats", getCustomerStats);

/**
 * @route   GET /api/customers/:id
 * @desc    Get single customer by ID
 * @access  Public
 */
router.get("/:id", getCustomerById);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer by ID
 * @access  Public
 */
router.put("/:id", updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete single customer by ID
 * @access  Public
 */
router.delete("/:id", deleteCustomer);

/**
 * @route   DELETE /api/customers
 * @desc    Bulk delete customers by IDs array
 * @access  Public
 * @body    { ids: [string] } - Array of customer IDs to delete
 */
router.delete("/", bulkDeleteCustomers);

export default router;