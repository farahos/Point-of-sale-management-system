import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductQuantity,
  deleteProduct,
  bulkDeleteProducts,
  getProductStats
} from "../controller/ProductController.js";
import { authenticate, authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Public
 */
router.post("/",  createProduct);

/**
 * @route   GET /api/products
 * @desc    Get all products with pagination, search, and sorting
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   search - Search term for product name
 * @query   sortBy - Field to sort by (default: createdAt)
 * @query   sortOrder - Sort order: asc or desc (default: desc)
 */
router.get("/", authenticate, getAllProducts);

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Public
 */
router.get("/stats", getProductStats);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get("/:id", getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product by ID
 * @access  Public
 */
router.put("/:id",authenticate, updateProduct);

/**
 * @route   PATCH /api/products/:id/quantity
 * @desc    Update product quantity (add/remove stock)
 * @access  Public
 */
router.patch("/:id/quantity", updateProductQuantity);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete single product by ID
 * @access  Public
 */
router.delete("/:id", deleteProduct);

/**
 * @route   DELETE /api/products
 * @desc    Bulk delete products by IDs array
 * @access  Public
 * @body    { ids: [string] } - Array of product IDs to delete
 */
router.delete("/", bulkDeleteProducts);

export default router;