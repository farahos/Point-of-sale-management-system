import Report from '../model/reportModel.js';
import Product from '../model/Products.js';
import Sale from '../model/Sales.js';
import moment from 'moment';

/**
 * Generate sales report
 */
export const generateSalesReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      month,
      year,
      productId,
      category,
      dateRange = 'custom'
    } = req.query;

    // Build filter object
    const filter = {};
    const dateFilter = {};

    // Date range filter
    if (dateRange === 'daily') {
      const today = moment().startOf('day');
      dateFilter.createdAt = {
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate()
      };
    } else if (dateRange === 'weekly') {
      dateFilter.createdAt = {
        $gte: moment().startOf('week').toDate(),
        $lte: moment().endOf('week').toDate()
      };
    } else if (dateRange === 'monthly') {
      dateFilter.createdAt = {
        $gte: moment().startOf('month').toDate(),
        $lte: moment().endOf('month').toDate()
      };
    } else if (dateRange === 'yearly') {
      dateFilter.createdAt = {
        $gte: moment().startOf('year').toDate(),
        $lte: moment().endOf('year').toDate()
      };
    } else if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const start = moment(`${year}-${month}`, 'YYYY-MM').startOf('month');
      const end = moment(start).endOf('month');
      dateFilter.createdAt = {
        $gte: start.toDate(),
        $lte: end.toDate()
      };
    } else if (year) {
      const start = moment(`${year}-01`, 'YYYY-MM').startOf('year');
      const end = moment(start).endOf('year');
      dateFilter.createdAt = {
        $gte: start.toDate(),
        $lte: end.toDate()
      };
    }

    // Apply date filter if exists
    if (Object.keys(dateFilter).length > 0) {
      filter.$and = filter.$and || [];
      filter.$and.push(dateFilter);
    }

    // Additional filters
    if (productId) {
      filter.productId = productId;
    }
    if (category) {
      filter['product.category'] = category;
    }

    // Fetch sales data
    const sales = await Sale.find(filter)
      .populate('productId', 'name category price')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

    // Group by product category
    const categoryStats = sales.reduce((acc, sale) => {
      const category = sale.productId?.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          revenue: 0,
          profit: 0
        };
      }
      acc[category].count += 1;
      acc[category].revenue += sale.totalAmount;
      acc[category].profit += sale.profit || 0;
      return acc;
    }, {});

    // Prepare report data
    const reportData = {
      summary: {
        totalSales,
        totalRevenue,
        totalProfit,
        averageSaleValue: totalRevenue / (totalSales || 1)
      },
      categoryStats,
      salesData: sales,
      filters: {
        startDate,
        endDate,
        month,
        year,
        dateRange,
        category,
        productId
      },
      generatedAt: new Date(),
      period: dateRange
    };

    // Save report to database
    const savedReport = await Report.create({
      reportType: 'sales',
      reportName: `Sales Report - ${moment().format('YYYY-MM-DD HH:mm')}`,
      filters: req.query,
      data: reportData,
      generatedBy: req.user?._id,
      format: 'json'
    });

    res.status(200).json({
      success: true,
      message: 'Sales report generated successfully',
      report: reportData,
      reportId: savedReport._id
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales report',
      error: error.message
    });
  }
};

/**
 * Generate products report
 */
export const generateProductsReport = async (req, res) => {
  try {
    const {
      category,
      minQuantity,
      maxQuantity,
      minPrice,
      maxPrice,
      status
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (minQuantity || maxQuantity) {
      filter.quantity = {};
      if (minQuantity) filter.quantity.$gte = parseInt(minQuantity);
      if (maxQuantity) filter.quantity.$lte = parseInt(maxQuantity);
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (status) {
      filter.status = status;
    }

    // Fetch products with sales data
    const products = await Product.find(filter).lean();
    
    // Get sales data for each product
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const sales = await Sale.find({ productId: product._id });
        const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const revenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        
        return {
          ...product,
          totalSold,
          revenue,
          turnoverRate: (totalSold / (product.quantity + totalSold)) * 100 || 0
        };
      })
    );

    // Calculate statistics
    const totalProducts = productsWithStats.length;
    const totalValue = productsWithStats.reduce((sum, product) => 
      sum + (product.price * product.quantity), 0);
    const lowStock = productsWithStats.filter(p => p.quantity <= p.minStockLevel).length;

    const reportData = {
      summary: {
        totalProducts,
        totalValue,
        lowStockCount: lowStock,
        averagePrice: totalValue / (totalProducts || 1)
      },
      products: productsWithStats,
      filters: req.query,
      generatedAt: new Date()
    };

    // Save report
    const savedReport = await Report.create({
      reportType: 'products',
      reportName: `Products Report - ${moment().format('YYYY-MM-DD HH:mm')}`,
      filters: req.query,
      data: reportData,
      generatedBy: req.user?._id,
      format: 'json'
    });

    res.status(200).json({
      success: true,
      message: 'Products report generated successfully',
      report: reportData,
      reportId: savedReport._id
    });
  } catch (error) {
    console.error('Error generating products report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating products report',
      error: error.message
    });
  }
};

/**
 * Generate repairs report
 */
export const generateRepairsReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      technician,
      dateRange = 'custom'
    } = req.query;

    const filter = {};
    const dateFilter = {};

    // Date filtering (same logic as sales report)
    if (dateRange === 'daily') {
      const today = moment().startOf('day');
      dateFilter.createdAt = {
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate()
      };
    } else if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (Object.keys(dateFilter).length > 0) {
      filter.$and = filter.$and || [];
      filter.$and.push(dateFilter);
    }

    if (status) {
      filter.status = status;
    }
    if (technician) {
      filter.technician = technician;
    }

    // Fetch repairs data
    const repairs = await Repair.find(filter)
      .populate('customerId', 'name phone')
      .populate('productId', 'name model')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalRepairs = repairs.length;
    const completedRepairs = repairs.filter(r => r.status === 'completed').length;
    const pendingRepairs = repairs.filter(r => r.status === 'pending').length;
    const totalRevenue = repairs.reduce((sum, repair) => sum + repair.serviceCharge, 0);

    // Group by status
    const statusStats = repairs.reduce((acc, repair) => {
      if (!acc[repair.status]) {
        acc[repair.status] = 0;
      }
      acc[repair.status]++;
      return acc;
    }, {});

    // Calculate average completion time
    const completedRepairsWithTime = repairs.filter(r => 
      r.status === 'completed' && r.completedAt && r.createdAt
    );
    const avgCompletionTime = completedRepairsWithTime.length > 0
      ? completedRepairsWithTime.reduce((sum, repair) => {
          const timeDiff = new Date(repair.completedAt) - new Date(repair.createdAt);
          return sum + timeDiff;
        }, 0) / completedRepairsWithTime.length
      : 0;

    const reportData = {
      summary: {
        totalRepairs,
        completedRepairs,
        pendingRepairs,
        completionRate: (completedRepairs / totalRepairs) * 100 || 0,
        totalRevenue,
        avgCompletionTime: Math.round(avgCompletionTime / (1000 * 60 * 60 * 24)) // Convert to days
      },
      statusStats,
      repairsData: repairs,
      filters: req.query,
      generatedAt: new Date()
    };

    // Save report
    const savedReport = await Report.create({
      reportType: 'repairs',
      reportName: `Repairs Report - ${moment().format('YYYY-MM-DD HH:mm')}`,
      filters: req.query,
      data: reportData,
      generatedBy: req.user?._id,
      format: 'json'
    });

    res.status(200).json({
      success: true,
      message: 'Repairs report generated successfully',
      report: reportData,
      reportId: savedReport._id
    });
  } catch (error) {
    console.error('Error generating repairs report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating repairs report',
      error: error.message
    });
  }
};

/**
 * Generate combined report
 */
export const generateCombinedReport = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;

    // Generate date filter for all reports
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const start = moment(`${year}-${month}`, 'YYYY-MM').startOf('month');
      const end = moment(start).endOf('month');
      dateFilter.createdAt = {
        $gte: start.toDate(),
        $lte: end.toDate()
      };
    }

    // Fetch data from all sources
    const [sales, products, repairs] = await Promise.all([
      Sale.find(dateFilter).lean(),
      Product.find({}).lean(),
      Repair.find(dateFilter).lean()
    ]);

    // Calculate combined statistics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const repairRevenue = repairs.reduce((sum, repair) => sum + repair.serviceCharge, 0);
    const totalInventoryValue = products.reduce((sum, product) => 
      sum + (product.price * product.quantity), 0);

    const combinedReport = {
      overview: {
        totalSales: sales.length,
        totalProducts: products.length,
        totalRepairs: repairs.length,
        totalRevenue: totalRevenue + repairRevenue,
        inventoryValue: totalInventoryValue,
        dateRange: `${startDate || 'N/A'} to ${endDate || 'N/A'}`
      },
      salesSummary: {
        count: sales.length,
        revenue: totalRevenue,
        averageSale: totalRevenue / (sales.length || 1)
      },
      productsSummary: {
        count: products.length,
        totalValue: totalInventoryValue,
        lowStock: products.filter(p => p.quantity <= p.minStockLevel).length
      },
      repairsSummary: {
        count: repairs.length,
        revenue: repairRevenue,
        completed: repairs.filter(r => r.status === 'completed').length,
        pending: repairs.filter(r => r.status === 'pending').length
      },
      generatedAt: new Date(),
      filters: req.query
    };

    // Save combined report
    const savedReport = await Report.create({
      reportType: 'combined',
      reportName: `Combined Report - ${moment().format('YYYY-MM-DD HH:mm')}`,
      filters: req.query,
      data: combinedReport,
      generatedBy: req.user?._id,
      format: 'json'
    });

    res.status(200).json({
      success: true,
      message: 'Combined report generated successfully',
      report: combinedReport,
      reportId: savedReport._id
    });
  } catch (error) {
    console.error('Error generating combined report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating combined report',
      error: error.message
    });
  }
};

/**
 * Get saved reports
 */
export const getSavedReports = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const filter = {};

    if (reportType) {
      filter.reportType = reportType;
    }
    if (startDate && endDate) {
      filter.generationDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const reports = await Report.find(filter)
      .populate('generatedBy', 'name email')
      .sort({ generationDate: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

/**
 * Get report by ID
 */
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

/**
 * Delete report
 */
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};