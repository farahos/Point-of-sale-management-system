import mongoose from "mongoose";
import Sale from "../model/Sales.js"
import Product from "../model/Products.js"
import Customer from "../model/Customers.js"

/**
 * @desc    Create a new sale
 * @route   POST /api/sales
 * @access  Public
 */
export const createSale = async (req, res) => {
  try {
    const { productId, customerId, quantity, sellingPrice } = req.body;

    if (!productId || !customerId || !quantity || !sellingPrice) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.quantity}`
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const total = quantity * sellingPrice;
    const profit = (sellingPrice - product.costPrice) * quantity;

    const sale = await Sale.create({
      productId,
      customerId,
      quantity,
      sellingPrice,
      total,
      profit
    });

    // Update stock
    product.quantity -= quantity;
    await product.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate("productId", "name costPrice")
      .populate("customerId", "name phone");

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      data: populatedSale
    });

  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


/**
 * @desc    Get all sales with filters
 * @route   GET /api/sales
 * @access  Public
 */
export const getAllSales = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Date filtering
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    endDate && endDate.setHours(23, 59, 59, 999);

    // Build query
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.createdAt = { $gte: startDate };
    } else if (endDate) {
      query.createdAt = { $lte: endDate };
    }

    // Sorting
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // Execute query with population
    const sales = await Sale.find(query)
      .populate('productId', 'name costPrice')
      .populate('customerId', 'name phone')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Sale.countDocuments(query);

    // Calculate sales statistics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    // Get top selling products
    const topProducts = await Sale.aggregate([
      { $match: query },
      { $group: {
        _id: "$productId",
        totalSold: { $sum: "$quantity" },
        totalRevenue: { $sum: "$total" },
        totalProfit: { $sum: "$profit" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        productName: "$product.name",
        totalSold: 1,
        totalRevenue: 1,
        totalProfit: 1
      }}
    ]);

    // Get sales by day for chart
    const salesByDay = await Sale.aggregate([
      { $match: query },
      { $group: {
        _id: { 
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
        },
        count: { $sum: 1 },
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Sales retrieved successfully",
      data: sales,
      statistics: {
        totalSales: total,
        totalRevenue,
        totalProfit,
        totalItemsSold,
        averageSaleValue: totalRevenue / (sales.length || 1),
        averageProfitPerSale: totalProfit / (sales.length || 1)
      },
      topProducts,
      salesByDay,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get All Sales Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get single sale by ID
 * @route   GET /api/sales/:id
 * @access  Public
 */
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID"
      });
    }

    const sale = await Sale.findById(id)
      .populate('productId', 'name costPrice')
      .populate('customerId', 'name phone');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Sale retrieved successfully",
      data: sale
    });
  } catch (error) {
    console.error("Get Sale By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Update sale by ID
 * @route   PUT /api/sales/:id
 * @access  Public
 */

export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, customerId, quantity, sellingPrice } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid sale ID" });
    }

    const existingSale = await Sale.findById(id);
    if (!existingSale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    // Restore old stock
    const oldProduct = await Product.findById(existingSale.productId);
    if (oldProduct) {
      oldProduct.quantity += existingSale.quantity; // restore stock
      await oldProduct.save();
    }

    // Load new product
    let product = oldProduct;
    if (productId && productId !== existingSale.productId.toString()) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "New product not found" });
      }
    }

    // Validate stock
    const newQty = quantity || existingSale.quantity;
    if (product.quantity < newQty) {
      // Revert restore
      oldProduct.quantity -= existingSale.quantity;
      await oldProduct.save();

      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.quantity}`,
      });
    }

    // Recalculate totals
    const newPrice = sellingPrice || existingSale.sellingPrice;
    const total = newQty * newPrice;
    const profit = (newPrice - product.costPrice) * newQty;

    // Deduct new quantity
    product.quantity -= newQty;
    await product.save();

    // Update sale
    existingSale.productId = productId || existingSale.productId;
    existingSale.customerId = customerId || existingSale.customerId;
    existingSale.quantity = newQty;
    existingSale.sellingPrice = newPrice;
    existingSale.total = total;
    existingSale.profit = profit;

    await existingSale.save();

    const populatedSale = await Sale.findById(existingSale._id)
      .populate("productId", "name costPrice")
      .populate("customerId", "name phone");

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: populatedSale,
    });

  } catch (error) {
    console.error("Update Sale Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * @desc    Delete sale by ID
 * @route   DELETE /api/sales/:id
 * @access  Public
 */
export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid sale ID" });
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    // Restore product stock
    const product = await Product.findById(sale.productId);
    if (product) {
      product.quantity += sale.quantity;
      await product.save();
    }

    // Delete the sale
    await Sale.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Sale deleted successfully",
      data: {
        id,
        restoredQuantity: sale.quantity,
        productName: product?.name || "Unknown",
      },
    });

  } catch (error) {
    console.error("Delete Sale Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


/**
 * @desc    Get sales statistics
 * @route   GET /api/sales/stats/overview
 * @access  Public
 */
export const getSalesOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    // Today's sales
    const todaySales = await Sale.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" },
        items: { $sum: "$quantity" }
      }}
    ]);

    // Yesterday's sales
    const yesterdaySales = await Sale.aggregate([
      { $match: { createdAt: { $gte: yesterday, $lt: today } } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" },
        items: { $sum: "$quantity" }
      }}
    ]);

    // This week's sales
    const weekSales = await Sale.aggregate([
      { $match: { createdAt: { $gte: thisWeek } } },
      { $group: {
        _id: null,
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" }
      }}
    ]);

    // This month's sales
    const monthSales = await Sale.aggregate([
      { $match: { createdAt: { $gte: thisMonth } } },
      { $group: {
        _id: null,
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" }
      }}
    ]);

    // All time totals
    const allTime = await Sale.aggregate([
      { $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
        totalProfit: { $sum: "$profit" },
        totalItems: { $sum: "$quantity" }
      }}
    ]);

    // Best selling products
    const bestSellers = await Sale.aggregate([
      { $group: {
        _id: "$productId",
        totalSold: { $sum: "$quantity" },
        revenue: { $sum: "$total" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        name: "$product.name",
        totalSold: 1,
        revenue: 1
      }}
    ]);

    // Recent sales
    const recentSales = await Sale.find()
      .populate('productId', 'name')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: "Sales overview retrieved successfully",
      data: {
        today: {
          sales: todaySales[0]?.count || 0,
          revenue: todaySales[0]?.revenue || 0,
          profit: todaySales[0]?.profit || 0,
          items: todaySales[0]?.items || 0
        },
        yesterday: {
          sales: yesterdaySales[0]?.count || 0,
          revenue: yesterdaySales[0]?.revenue || 0,
          profit: yesterdaySales[0]?.profit || 0,
          items: yesterdaySales[0]?.items || 0
        },
        week: {
          revenue: weekSales[0]?.revenue || 0,
          profit: weekSales[0]?.profit || 0
        },
        month: {
          revenue: monthSales[0]?.revenue || 0,
          profit: monthSales[0]?.profit || 0
        },
        allTime: allTime[0] || {
          totalSales: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalItems: 0
        },
        bestSellers,
        recentSales
      }
    });
  } catch (error) {
    console.error("Get Sales Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get sales report by date range
 * @route   GET /api/sales/report
 * @access  Public
 */
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Daily sales breakdown
    const dailySales = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: { 
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
        },
        salesCount: { $sum: 1 },
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" },
        itemsSold: { $sum: "$quantity" }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Product-wise sales
    const productSales = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: "$productId",
        salesCount: { $sum: 1 },
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" },
        itemsSold: { $sum: "$quantity" }
      }},
      { $sort: { revenue: -1 } },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        productName: "$product.name",
        costPrice: "$product.costPrice",
        salesCount: 1,
        revenue: 1,
        profit: 1,
        itemsSold: 1
      }}
    ]);

    // Customer-wise sales
    const customerSales = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: "$customerId",
        salesCount: { $sum: 1 },
        revenue: { $sum: "$total" },
        profit: { $sum: "$profit" },
        itemsBought: { $sum: "$quantity" }
      }},
      { $sort: { revenue: -1 } },
      { $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customer"
      }},
      { $unwind: "$customer" },
      { $project: {
        customerName: "$customer.name",
        phone: "$customer.phone",
        salesCount: 1,
        revenue: 1,
        profit: 1,
        itemsBought: 1
      }}
    ]);

    // Summary
    const summary = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
        totalProfit: { $sum: "$profit" },
        totalItems: { $sum: "$quantity" }
      }}
    ]);

    res.status(200).json({
      success: true,
      message: "Sales report generated successfully",
      data: {
        period: { start, end },
        summary: summary[0] || {
          totalSales: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalItems: 0
        },
        dailySales,
        productSales,
        customerSales,
        averageOrderValue: summary[0] ? summary[0].totalRevenue / summary[0].totalSales : 0,
        averageProfitMargin: summary[0] ? (summary[0].totalProfit / summary[0].totalRevenue) * 100 : 0
      }
    });
  } catch (error) {
    console.error("Get Sales Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Bulk delete sales
 * @route   DELETE /api/sales
 * @access  Public
 */
export const bulkDeleteSales = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "IDs array is required"
      });
    }

    // Validate all IDs
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid sale IDs provided",
        invalidIds
      });
    }

    // Get sales and restore stock
    const sales = await Sale.find({ _id: { $in: ids } }).session(session);
    
    // Group quantities by product
    const productUpdates = {};
    sales.forEach(sale => {
      if (!productUpdates[sale.productId]) {
        productUpdates[sale.productId] = 0;
      }
      productUpdates[sale.productId] += sale.quantity;
    });

    // Update product stock
    for (const [productId, quantity] of Object.entries(productUpdates)) {
      const product = await Product.findById(productId).session(session);
      if (product) {
        product.quantity += quantity;
        await product.save({ session });
      }
    }

    // Delete sales
    const result = await Sale.deleteMany({ _id: { $in: ids } }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} sale(s) deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
        restoredItems: Object.values(productUpdates).reduce((a, b) => a + b, 0)
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Bulk Delete Sales Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
