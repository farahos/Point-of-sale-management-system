import Repair from "../model/repairModel.js";
import Product from '../model/Products.js'
// @desc    Get all repairs with filters
// @route   GET /api/repairs
// @access  Public
export const getRepairs = async (req, res) => {
  try {
    const { startDate, endDate, status, productId, customerId } = req.query;
    
    let query = {};
    
    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Status filter
    if (status) {
      query.repairStatus = status;
    }
    
    // Product filter
    if (productId) {
      query.productId = productId;
    }
    
    // Customer filter
    if (customerId) {
      query.customerId = customerId;
    }
    
    const repairs = await Repair.find(query)
      .populate('productId', 'name quantity costPrice sellingPrice')
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: repairs.length,
      data: repairs
    });
  } catch (error) {
    console.error("Error fetching repairs:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get single repair
// @route   GET /api/repairs/:id
// @access  Public
export const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate('productId', 'name quantity costPrice sellingPrice')
      .populate('customerId', 'name phone email address');
    
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: "Repair not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: repair
    });
  } catch (error) {
    console.error("Error fetching repair:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Create new repair AND decrement product stock
// @route   POST /api/repairs
// @access  Public
export const createRepair = async (req, res) => {
  try {
    const {
      productId,
      customerId,
      problem,
      color,
      caseIncluded,
      battery,
      repairCost,
      amountPaid,
      repairStatus,
      notes
    } = req.body;

    // Validate required fields
    if (!productId || !customerId || !problem || !repairCost) {
      return res.status(400).json({
        success: false,
        message: "Required fields: productId, customerId, problem, repairCost"
      });
    }

    // Check if product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock"
      });
    }

    // Create repair
    const newRepair = new Repair({
      productId,
      customerId,
      problem,
      color,
      caseIncluded,
      battery,
      repairCost: Number(repairCost) || 0,
      amountPaid: Number(amountPaid) || 0,
      repairStatus: repairStatus || 'pending',
      notes,
      remainingBalance: Math.max(0, (Number(repairCost) || 0) - (Number(amountPaid) || 0))
    });

    const savedRepair = await newRepair.save();

    // Decrement product quantity by 1 (like sales)
    product.quantity -= 1;
    await product.save();

    // Populate the saved repair
    const populatedRepair = await Repair.findById(savedRepair._id)
      .populate('productId', 'name quantity costPrice sellingPrice')
      .populate('customerId', 'name phone email');

    res.status(201).json({
      success: true,
      message: "Repair created successfully and product stock updated",
      data: populatedRepair
    });
  } catch (error) {
    console.error("Error creating repair:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Update repair
// @route   PUT /api/repairs/:id
// @access  Public
export const updateRepair = async (req, res) => {
  try {
    const {
      productId,
      customerId,
      problem,
      color,
      caseIncluded,
      battery,
      repairCost,
      amountPaid,
      repairStatus,
      notes
    } = req.body;

    // Find existing repair
    const existingRepair = await Repair.findById(req.params.id);
    if (!existingRepair) {
      return res.status(404).json({
        success: false,
        message: "Repair not found"
      });
    }

    // If product is being changed, handle stock adjustment
    if (productId && productId !== existingRepair.productId.toString()) {
      // Restore stock to old product
      const oldProduct = await Product.findById(existingRepair.productId);
      if (oldProduct) {
        oldProduct.quantity += 1;
        await oldProduct.save();
      }

      // Check new product availability
      const newProduct = await Product.findById(productId);
      if (!newProduct) {
        return res.status(404).json({
          success: false,
          message: "New product not found"
        });
      }

      if (newProduct.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "New product is out of stock"
        });
      }

      // Decrement stock from new product
      newProduct.quantity -= 1;
      await newProduct.save();
    }

    // Calculate remaining balance
    const remainingBalance = Math.max(0, 
      (Number(repairCost) || existingRepair.repairCost) - 
      (Number(amountPaid) || existingRepair.amountPaid)
    );

    const updatedRepair = await Repair.findByIdAndUpdate(
      req.params.id,
      {
        productId: productId || existingRepair.productId,
        customerId: customerId || existingRepair.customerId,
        problem: problem || existingRepair.problem,
        color: color !== undefined ? color : existingRepair.color,
        caseIncluded: caseIncluded !== undefined ? caseIncluded : existingRepair.caseIncluded,
        battery: battery !== undefined ? battery : existingRepair.battery,
        repairCost: Number(repairCost) || existingRepair.repairCost,
        amountPaid: Number(amountPaid) || existingRepair.amountPaid,
        repairStatus: repairStatus || existingRepair.repairStatus,
        notes: notes !== undefined ? notes : existingRepair.notes,
        remainingBalance,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('productId', 'name quantity costPrice sellingPrice')
     .populate('customerId', 'name phone email');

    res.status(200).json({
      success: true,
      message: "Repair updated successfully",
      data: updatedRepair
    });
  } catch (error) {
    console.error("Error updating repair:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Delete repair AND restore product stock
// @route   DELETE /api/repairs/:id
// @access  Public
export const deleteRepair = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: "Repair not found"
      });
    }

    // Restore product stock
    const product = await Product.findById(repair.productId);
    if (product) {
      product.quantity += 1;
      await product.save();
    }

    await Repair.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Repair deleted successfully and product stock restored",
      data: repair
    });
  } catch (error) {
    console.error("Error deleting repair:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Bulk delete repairs
// @route   DELETE /api/repairs
// @access  Public
export const bulkDeleteRepairs = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of repair IDs to delete"
      });
    }

    // Find all repairs to restore stock
    const repairs = await Repair.find({ _id: { $in: ids } });
    
    // Restore stock for all products
    for (const repair of repairs) {
      const product = await Product.findById(repair.productId);
      if (product) {
        product.quantity += 1;
        await product.save();
      }
    }

    // Delete repairs
    const result = await Repair.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} repair(s) deleted successfully and product stock restored`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error("Error bulk deleting repairs:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Update repair status
// @route   PATCH /api/repairs/:id/status
// @access  Public
export const updateRepairStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: pending, in_progress, completed"
      });
    }

    const updatedRepair = await Repair.findByIdAndUpdate(
      req.params.id,
      {
        repairStatus: status,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('productId', 'name quantity costPrice sellingPrice')
     .populate('customerId', 'name phone email');

    if (!updatedRepair) {
      return res.status(404).json({
        success: false,
        message: "Repair not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `Repair status updated to ${status}`,
      data: updatedRepair
    });
  } catch (error) {
    console.error("Error updating repair status:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get repair statistics
// @route   GET /api/repairs/stats/summary
// @access  Public
export const getRepairStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Get counts by status
    const statusStats = await Repair.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$repairStatus',
          count: { $sum: 1 },
          totalCost: { $sum: '$repairCost' },
          totalPaid: { $sum: '$amountPaid' },
          totalBalance: { $sum: '$remainingBalance' }
        }
      }
    ]);

    // Get totals
    const totals = await Repair.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRepairs: { $sum: 1 },
          totalRevenue: { $sum: '$repairCost' },
          totalPaid: { $sum: '$amountPaid' },
          totalBalance: { $sum: '$remainingBalance' },
          avgRepairCost: { $avg: '$repairCost' }
        }
      }
    ]);

    // Convert status stats to object
    const statusCounts = {
      pending: 0,
      in_progress: 0,
      completed: 0
    };

    const statusDetails = {};
    statusStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
      statusDetails[stat._id] = {
        count: stat.count,
        totalCost: stat.totalCost,
        totalPaid: stat.totalPaid,
        totalBalance: stat.totalBalance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...totals[0] || {
          totalRepairs: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalBalance: 0,
          avgRepairCost: 0
        },
        statusCounts,
        statusDetails
      }
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Search repairs
// @route   GET /api/repairs/search
// @access  Public
export const searchRepairs = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const repairs = await Repair.find({
      $or: [
        { problem: { $regex: query, $options: 'i' } },
        { notes: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('productId', 'name quantity')
    .populate('customerId', 'name phone')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: repairs.length,
      data: repairs
    });
  } catch (error) {
    console.error("Error searching repairs:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};