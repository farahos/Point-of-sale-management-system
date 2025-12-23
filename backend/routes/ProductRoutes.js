import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductQuantity,
  bulkDeleteProducts,
  getProductStats,
  getProductsByCategory
} from '../controller/productController.js';

const router = express.Router();

// Public routes
router.route('/')
  .post(createProduct)        // Create new product
  .get(getAllProducts)        // Get all products with pagination & search
  .delete(bulkDeleteProducts); // Bulk delete products

router.route('/stats')
  .get(getProductStats);      // Get product statistics

router.route('/category/:category')
  .get(getProductsByCategory); // Get products by category

router.route('/:id')
  .get(getProductById)        // Get single product by ID
  .put(updateProduct)         // Update product
  .delete(deleteProduct);     // Delete single product

router.route('/:id/quantity')
  .patch(updateProductQuantity); // Update product quantity

export default router;