import mongoose from "mongoose";
import Product from "../model/Products.js";

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Public
 */
export const createProduct = async (req, res) => {
  try {
    const { name, costPrice, quantity } = req.body;

    // Validate required fields
    if (!name || !costPrice || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Name, cost price, and quantity are required"
      });
    }

    // Validate numeric fields
    if (isNaN(costPrice) || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Cost price and quantity must be numbers"
      });
    }

    if (costPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cost price must be greater than 0"
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative"
      });
    }

    // Check if product with same name exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with this name already exists"
      });
    }

    const product = await Product.create({ 
      name, 
      costPrice: parseFloat(costPrice), 
      quantity: parseInt(quantity)
    });

    // Calculate total value
    const totalValue = product.costPrice * product.quantity;

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        ...product._doc,
        totalValue
      }
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search functionality
    const searchQuery = req.query.search || "";
    const query = searchQuery
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } }
          ]
        }
      : {};

    // Sorting
    const sortField = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Calculate total value for each product
    const productsWithTotal = products.map(product => ({
      ...product._doc,
      totalValue: product.costPrice * product.quantity
    }));

    // Get total count for pagination info
    const total = await Product.countDocuments(query);

    // Calculate inventory statistics
    const totalProductsValue = productsWithTotal.reduce((sum, product) => 
      sum + product.totalValue, 0
    );
    const totalItemsInStock = productsWithTotal.reduce((sum, product) => 
      sum + product.quantity, 0
    );

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: productsWithTotal,
      statistics: {
        totalProducts: total,
        totalProductsValue,
        totalItemsInStock,
        averageProductValue: totalProductsValue / (productsWithTotal.length || 1)
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Calculate total value
    const totalValue = product.costPrice * product.quantity;

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: {
        ...product._doc,
        totalValue
      }
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Update product by ID
 * @route   PUT /api/products/:id
 * @access  Public
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, costPrice, quantity } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Validate numeric fields if provided
    if (costPrice && (isNaN(costPrice) || costPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Cost price must be a number greater than 0"
      });
    }

    if (quantity && (isNaN(quantity) || quantity < 0)) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative"
      });
    }

    // Check if name is being updated and if it already exists
    if (name && name !== existingProduct.name) {
      const nameExists = await Product.findOne({ 
        name, 
        _id: { $ne: id } 
      });
      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: "Another product with this name already exists"
        });
      }
    }

    // Update product
    const updateData = {};
    if (name) updateData.name = name;
    if (costPrice) updateData.costPrice = parseFloat(costPrice);
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Calculate total value
    const totalValue = updatedProduct.costPrice * updatedProduct.quantity;

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        ...updatedProduct._doc,
        totalValue
      }
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Update product quantity (add or remove stock)
 * @route   PATCH /api/products/:id/quantity
 * @access  Public
 */
export const updateProductQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, amount } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Validate action and amount
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'add' or 'remove'"
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number"
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    let newQuantity;
    if (action === 'add') {
      newQuantity = product.quantity + parseInt(amount);
    } else {
      newQuantity = product.quantity - parseInt(amount);
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock to remove this amount"
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { quantity: newQuantity },
      { new: true, runValidators: true }
    );

    // Calculate total value
    const totalValue = updatedProduct.costPrice * updatedProduct.quantity;

    res.status(200).json({
      success: true,
      message: `Stock ${action === 'add' ? 'added to' : 'removed from'} product successfully`,
      data: {
        ...updatedProduct._doc,
        totalValue,
        previousQuantity: product.quantity,
        quantityChange: action === 'add' ? parseInt(amount) : -parseInt(amount)
      }
    });
  } catch (error) {
    console.error("Update Product Quantity Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Delete product by ID
 * @route   DELETE /api/products/:id
 * @access  Public
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Store product info before deletion
    const productInfo = {
      name: product.name,
      quantity: product.quantity,
      totalValue: product.costPrice * product.quantity
    };

    // Delete product
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: {
        id,
        ...productInfo
      }
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Bulk delete products
 * @route   DELETE /api/products
 * @access  Public
 */
export const bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    // Validate ids array
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "IDs array is required"
      });
    }

    // Validate all IDs
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product IDs provided",
        invalidIds
      });
    }

    // Get products info before deletion
    const productsToDelete = await Product.find({ _id: { $in: ids } });
    const totalValue = productsToDelete.reduce((sum, product) => 
      sum + (product.costPrice * product.quantity), 0
    );
    const totalQuantity = productsToDelete.reduce((sum, product) => 
      sum + product.quantity, 0
    );

    // Delete products
    const result = await Product.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found to delete"
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} product(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
        totalValueDeleted: totalValue,
        totalQuantityDeleted: totalQuantity
      }
    });
  } catch (error) {
    console.error("Bulk Delete Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get product statistics
 * @route   GET /api/products/stats
 * @access  Public
 */
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    
    const products = await Product.find();
    const totalInventoryValue = products.reduce((sum, product) => 
      sum + (product.costPrice * product.quantity), 0
    );
    const totalItemsInStock = products.reduce((sum, product) => 
      sum + product.quantity, 0
    );

    // Low stock products (less than 10 items)
    const lowStockProducts = await Product.countDocuments({ quantity: { $lt: 10 } });

    // Out of stock products
    const outOfStockProducts = await Product.countDocuments({ quantity: 0 });

    // Most valuable products (by total value)
    const mostValuableProducts = await Product.aggregate([
      {
        $addFields: {
          totalValue: { $multiply: ["$costPrice", "$quantity"] }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 }
    ]);

    // Recently added products
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await Product.countDocuments({
      createdAt: { $gte: today }
    });

    res.status(200).json({
      success: true,
      message: "Product statistics retrieved successfully",
      data: {
        totalProducts,
        totalInventoryValue,
        totalItemsInStock,
        averageProductValue: totalInventoryValue / (totalProducts || 1),
        lowStockProducts,
        outOfStockProducts,
        newToday,
        mostValuableProducts: mostValuableProducts.map(product => ({
          name: product.name,
          totalValue: product.totalValue,
          quantity: product.quantity
        }))
      }
    });
  } catch (error) {
    console.error("Get Product Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};