import mongoose from "mongoose";
import Product from "../model/Products.js";

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Public
 */
export const createProduct = async (req, res) => {
  try {
    const { name, sku, category, costPrice, sellingPrice, quantity } = req.body;

    // Validate required fields
    if (!name || !sku || !category || !costPrice || !sellingPrice || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Name, SKU, category, cost price, selling price, and quantity are required"
      });
    }

    // Validate numeric fields
    if (isNaN(costPrice) || isNaN(sellingPrice) || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Cost price, selling price, and quantity must be numbers"
      });
    }

    if (costPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cost price must be greater than 0"
      });
    }

    if (sellingPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be greater than 0"
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative"
      });
    }

    // Validate selling price is greater than or equal to cost price
    if (parseFloat(sellingPrice) < parseFloat(costPrice)) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be greater than or equal to cost price"
      });
    }

    // Check if product with same SKU exists
    const existingProductBySKU = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProductBySKU) {
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists"
      });
    }

    // Check if product with same name exists
    const existingProductByName = await Product.findOne({ name });
    if (existingProductByName) {
      return res.status(409).json({
        success: false,
        message: "Product with this name already exists"
      });
    }

    const product = await Product.create({ 
      name, 
      sku: sku.toUpperCase(),
      category,
      costPrice: parseFloat(costPrice), 
      sellingPrice: parseFloat(sellingPrice),
      quantity: parseInt(quantity)
    });

    // Calculate total value and profit margin
    const totalValue = product.costPrice * product.quantity;
    const profitMargin = ((product.sellingPrice - product.costPrice) / product.costPrice) * 100;

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        ...product._doc,
        totalValue,
        profitMargin: profitMargin.toFixed(2),
        profitPerUnit: product.sellingPrice - product.costPrice
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
            { name: { $regex: searchQuery, $options: "i" } },
            { sku: { $regex: searchQuery, $options: "i" } },
            { category: { $regex: searchQuery, $options: "i" } }
          ]
        }
      : {};

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Sorting
    const sortField = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Calculate additional fields for each product
    const productsWithCalculations = products.map(product => {
      const totalValue = product.costPrice * product.quantity;
      const potentialRevenue = product.sellingPrice * product.quantity;
      const profitPerUnit = product.sellingPrice - product.costPrice;
      const profitMargin = ((profitPerUnit) / product.costPrice) * 100;
      const totalPotentialProfit = profitPerUnit * product.quantity;

      return {
        ...product._doc,
        totalValue,
        potentialRevenue,
        profitPerUnit,
        profitMargin: profitMargin.toFixed(2),
        totalPotentialProfit
      };
    });

    // Get total count for pagination info
    const total = await Product.countDocuments(query);

    // Calculate inventory statistics
    const totalProductsValue = productsWithCalculations.reduce((sum, product) => 
      sum + product.totalValue, 0
    );
    const totalItemsInStock = productsWithCalculations.reduce((sum, product) => 
      sum + product.quantity, 0
    );
    const totalPotentialRevenue = productsWithCalculations.reduce((sum, product) => 
      sum + product.potentialRevenue, 0
    );
    const totalPotentialProfit = productsWithCalculations.reduce((sum, product) => 
      sum + product.totalPotentialProfit, 0
    );

    // Get unique categories for filter dropdown
    const categories = await Product.distinct("category");

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: productsWithCalculations,
      filters: {
        categories
      },
      statistics: {
        totalProducts: total,
        totalProductsValue,
        totalItemsInStock,
        totalPotentialRevenue,
        totalPotentialProfit,
        averageProductValue: totalProductsValue / (productsWithCalculations.length || 1),
        averageProfitMargin: ((totalPotentialProfit / totalProductsValue) * 100).toFixed(2) || "0.00"
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

    // Calculate additional fields
    const totalValue = product.costPrice * product.quantity;
    const potentialRevenue = product.sellingPrice * product.quantity;
    const profitPerUnit = product.sellingPrice - product.costPrice;
    const profitMargin = ((profitPerUnit) / product.costPrice) * 100;
    const totalPotentialProfit = profitPerUnit * product.quantity;

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: {
        ...product._doc,
        totalValue,
        potentialRevenue,
        profitPerUnit,
        profitMargin: profitMargin.toFixed(2),
        totalPotentialProfit
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
    const { name, sku, category, costPrice, sellingPrice, quantity } = req.body;

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

    if (sellingPrice && (isNaN(sellingPrice) || sellingPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be a number greater than 0"
      });
    }

    if (quantity !== undefined && (isNaN(quantity) || quantity < 0)) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative"
      });
    }

    // Validate selling price is greater than or equal to cost price
    const finalCostPrice = costPrice || existingProduct.costPrice;
    const finalSellingPrice = sellingPrice || existingProduct.sellingPrice;
    if (parseFloat(finalSellingPrice) < parseFloat(finalCostPrice)) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be greater than or equal to cost price"
      });
    }

    // Check if SKU is being updated and if it already exists
    if (sku && sku.toUpperCase() !== existingProduct.sku) {
      const skuExists = await Product.findOne({ 
        sku: sku.toUpperCase(), 
        _id: { $ne: id } 
      });
      if (skuExists) {
        return res.status(409).json({
          success: false,
          message: "Another product with this SKU already exists"
        });
      }
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
    if (sku) updateData.sku = sku.toUpperCase();
    if (category) updateData.category = category;
    if (costPrice) updateData.costPrice = parseFloat(costPrice);
    if (sellingPrice) updateData.sellingPrice = parseFloat(sellingPrice);
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Calculate additional fields
    const totalValue = updatedProduct.costPrice * updatedProduct.quantity;
    const potentialRevenue = updatedProduct.sellingPrice * updatedProduct.quantity;
    const profitPerUnit = updatedProduct.sellingPrice - updatedProduct.costPrice;
    const profitMargin = ((profitPerUnit) / updatedProduct.costPrice) * 100;
    const totalPotentialProfit = profitPerUnit * updatedProduct.quantity;

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        ...updatedProduct._doc,
        totalValue,
        potentialRevenue,
        profitPerUnit,
        profitMargin: profitMargin.toFixed(2),
        totalPotentialProfit
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

    // Calculate additional fields
    const totalValue = updatedProduct.costPrice * updatedProduct.quantity;
    const potentialRevenue = updatedProduct.sellingPrice * updatedProduct.quantity;
    const profitPerUnit = updatedProduct.sellingPrice - updatedProduct.costPrice;
    const profitMargin = ((profitPerUnit) / updatedProduct.costPrice) * 100;
    const totalPotentialProfit = profitPerUnit * updatedProduct.quantity;

    res.status(200).json({
      success: true,
      message: `Stock ${action === 'add' ? 'added to' : 'removed from'} product successfully`,
      data: {
        ...updatedProduct._doc,
        totalValue,
        potentialRevenue,
        profitPerUnit,
        profitMargin: profitMargin.toFixed(2),
        totalPotentialProfit,
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
    const totalValue = product.costPrice * product.quantity;
    const potentialRevenue = product.sellingPrice * product.quantity;
    const profitPerUnit = product.sellingPrice - product.costPrice;
    const totalPotentialProfit = profitPerUnit * product.quantity;

    const productInfo = {
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      totalValue,
      potentialRevenue,
      profitPerUnit,
      totalPotentialProfit
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
    const totalPotentialRevenue = productsToDelete.reduce((sum, product) => 
      sum + (product.sellingPrice * product.quantity), 0
    );
    const totalPotentialProfit = productsToDelete.reduce((sum, product) => 
      sum + ((product.sellingPrice - product.costPrice) * product.quantity), 0
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
        totalQuantityDeleted: totalQuantity,
        totalPotentialRevenueDeleted: totalPotentialRevenue,
        totalPotentialProfitDeleted: totalPotentialProfit
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
    const totalPotentialRevenue = products.reduce((sum, product) => 
      sum + (product.sellingPrice * product.quantity), 0
    );
    const totalPotentialProfit = products.reduce((sum, product) => 
      sum + ((product.sellingPrice - product.costPrice) * product.quantity), 0
    );

    // Low stock products (less than 10 items)
    const lowStockProducts = await Product.countDocuments({ quantity: { $lt: 10, $gt: 0 } });

    // Out of stock products
    const outOfStockProducts = await Product.countDocuments({ quantity: 0 });

    // Most valuable products (by total value)
    const mostValuableProducts = await Product.aggregate([
      {
        $addFields: {
          totalValue: { $multiply: ["$costPrice", "$quantity"] },
          potentialRevenue: { $multiply: ["$sellingPrice", "$quantity"] },
          profitPerUnit: { $subtract: ["$sellingPrice", "$costPrice"] }
        }
      },
      {
        $addFields: {
          totalProfit: { $multiply: ["$profitPerUnit", "$quantity"] }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 }
    ]);

    // Highest profit margin products
    const highestMarginProducts = await Product.aggregate([
      {
        $addFields: {
          profitMargin: {
            $multiply: [
              { $divide: [{ $subtract: ["$sellingPrice", "$costPrice"] }, "$costPrice"] },
              100
            ]
          }
        }
      },
      { $sort: { profitMargin: -1 } },
      { $limit: 5 }
    ]);

    // Recently added products
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await Product.countDocuments({
      createdAt: { $gte: today }
    });

    // Category statistics
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$costPrice", "$quantity"] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Product statistics retrieved successfully",
      data: {
        totalProducts,
        totalInventoryValue,
        totalItemsInStock,
        totalPotentialRevenue,
        totalPotentialProfit,
        averageProductValue: totalInventoryValue / (totalProducts || 1),
        averageProfitMargin: ((totalPotentialProfit / totalInventoryValue) * 100).toFixed(2) || "0.00",
        lowStockProducts,
        outOfStockProducts,
        newToday,
        mostValuableProducts: mostValuableProducts.map(product => ({
          name: product.name,
          sku: product.sku,
          category: product.category,
          totalValue: product.totalValue,
          potentialRevenue: product.potentialRevenue,
          totalProfit: product.totalProfit,
          quantity: product.quantity
        })),
        highestMarginProducts: highestMarginProducts.map(product => ({
          name: product.name,
          sku: product.sku,
          category: product.category,
          profitMargin: product.profitMargin.toFixed(2),
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice
        })),
        categoryStats
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

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { category: { $regex: new RegExp(category, 'i') } };

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    const productsWithCalculations = products.map(product => {
      const totalValue = product.costPrice * product.quantity;
      const potentialRevenue = product.sellingPrice * product.quantity;
      const profitPerUnit = product.sellingPrice - product.costPrice;
      const profitMargin = ((profitPerUnit) / product.costPrice) * 100;
      const totalPotentialProfit = profitPerUnit * product.quantity;

      return {
        ...product._doc,
        totalValue,
        potentialRevenue,
        profitPerUnit,
        profitMargin: profitMargin.toFixed(2),
        totalPotentialProfit
      };
    });

    // Category statistics
    const categoryStats = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$category",
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalInventoryValue: { $sum: { $multiply: ["$costPrice", "$quantity"] } },
          totalPotentialRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: `Products in category '${category}' retrieved successfully`,
      data: productsWithCalculations,
      categoryStats: categoryStats[0] || {},
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get Products By Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};