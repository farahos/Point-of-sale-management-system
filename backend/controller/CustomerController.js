import mongoose from "mongoose";
import Customer from "../model/Customers.js";

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Public
 */
export const createCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required"
      });
    }

    // Check if customer with phone already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer with this phone number already exists"
      });
    }

    const customer = await Customer.create({ name, phone });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) {
    console.error("Create Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Public
 */
export const getAllCustomers = async (req, res) => {
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
            { phone: { $regex: searchQuery, $options: "i" } }
          ]
        }
      : {};

    // Sorting
    const sortField = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // Execute query
    const customers = await Customer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get All Customers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Public
 */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer retrieved successfully",
      data: customer
    });
  } catch (error) {
    console.error("Get Customer By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Update customer by ID
 * @route   PUT /api/customers/:id
 * @access  Public
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    // Check if customer exists
    const existingCustomer = await Customer.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Check if phone is being updated and if it already exists
    if (phone && phone !== existingCustomer.phone) {
      const phoneExists = await Customer.findOne({ 
        phone, 
        _id: { $ne: id } 
      });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: "Another customer with this phone number already exists"
        });
      }
    }

    // Update customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Delete customer by ID
 * @route   DELETE /api/customers/:id
 * @access  Public
 */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Delete customer
    await Customer.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: { id }
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Bulk delete customers
 * @route   DELETE /api/customers
 * @access  Public
 */
export const bulkDeleteCustomers = async (req, res) => {
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
        message: "Invalid customer IDs provided",
        invalidIds
      });
    }

    // Delete customers
    const result = await Customer.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No customers found to delete"
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} customer(s) deleted successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error("Bulk Delete Customers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get customer statistics
 * @route   GET /api/customers/stats
 * @access  Public
 */
export const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await Customer.countDocuments({
      createdAt: { $gte: today }
    });

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newLastWeek = await Customer.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    res.status(200).json({
      success: true,
      message: "Customer statistics retrieved successfully",
      data: {
        totalCustomers,
        newToday,
        newLastWeek
      }
    });
  } catch (error) {
    console.error("Get Customer Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};