import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    // Products stats
    products: 0,
    totalInventoryValue: 0,
    lowStockProducts: 0,
    
    // Customers stats
    customers: 0,
    
    // Today stats
    todayProfit: 0,
    todayRevenue: 0,
    todaySales: 0,
    
    // Monthly stats
    monthlyProfit: 0,
    monthlyRevenue: 0,
    monthlySales: 0,
    
    // Repairs stats
    totalRepairs: 0,
    totalRepairRevenue: 0,
    pendingAmount: 0,
    totalPaid: 0,
    todayRepairs: 0,
    todayRepairRevenue: 0,
    todayPending: 0,
    monthlyRepairs: 0,
    monthlyRepairRevenue: 0,
    completedRepairs: 0,
    inProgressRepairs: 0
  });
  
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Format date for API call
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  // Prepare last 7 days sales chart data
  const prepareSalesChartData = (sales) => {
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Filter sales for this day
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt || sale.date || sale.saleDate);
        return saleDate >= date && saleDate < nextDay;
      });
      
      const revenue = daySales.reduce((sum, sale) => sum + (sale.total || sale.amount || 0), 0);
      const profit = daySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateFull: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        profit,
        sales: daySales.length
      });
    }
    
    return last7Days;
  };

  // Prepare last 7 days repair revenue chart data
  const prepareRepairChartData = (repairs) => {
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Filter repairs for this day
      const dayRepairs = repairs.filter(repair => {
        const repairDate = new Date(repair.date || repair.createdAt);
        return repairDate >= date && repairDate < nextDay;
      });
      
      const revenue = dayRepairs.reduce((sum, repair) => sum + (repair.agreedPrice || repair.price || 0), 0);
      const pending = dayRepairs.reduce((sum, repair) => sum + (repair.remaining || repair.balance || 0), 0);
      const completed = dayRepairs.filter(repair => (repair.remaining || repair.balance || 0) === 0).length;
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateFull: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        pending,
        repairs: dayRepairs.length,
        completed
      });
    }
    
    return last7Days;
  };

  // Prepare phone model distribution data
  const prepareModelDistributionData = (repairs) => {
    const modelMap = {};
    
    repairs.forEach(repair => {
      const model = repair.model || repair.deviceModel || 'Unknown';
      if (!modelMap[model]) {
        modelMap[model] = {
          name: model,
          count: 0,
          revenue: 0,
          pending: 0
        };
      }
      modelMap[model].count++;
      modelMap[model].revenue += repair.agreedPrice || repair.price || 0;
      modelMap[model].pending += repair.remaining || repair.balance || 0;
    });
    
    // Convert to array and get top 5 models
    const modelArray = Object.values(modelMap);
    return modelArray
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name,
        repairs: item.count,
        revenue: item.revenue,
        pending: item.pending
      }));
  };

  // Prepare product data for chart
  const prepareProductData = (products) => {
    if (!Array.isArray(products)) return [];
    
    const productsWithValue = products.map(product => ({
      name: product.name || 'Unnamed Product',
      value: (product.costPrice || product.price || 0) * (product.quantity || product.stock || 0),
      quantity: product.quantity || product.stock || 0,
      costPrice: product.costPrice || product.price || 0
    }));
    
    return productsWithValue
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Fetch data with error handling
  const fetchData = async (url, fallbackData = []) => {
    try {
      const response = await axios.get(url);
      return response.data.data || response.data || fallbackData;
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error.message);
      return fallbackData;
    }
  };

  // Calculate sales stats from data
  const calculateSalesStats = (sales, startDate, endDate = new Date()) => {
    if (!Array.isArray(sales)) return { count: 0, revenue: 0, profit: 0 };
    
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date || sale.saleDate);
      return saleDate >= startDate && saleDate <= endDate;
    });
    
    return {
      count: filteredSales.length,
      revenue: filteredSales.reduce((sum, sale) => sum + (sale.total || sale.amount || 0), 0),
      profit: filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0)
    };
  };

  // Calculate repair stats from data
  const calculateRepairStats = (repairs, startDate, endDate = new Date()) => {
    if (!Array.isArray(repairs)) return { count: 0, revenue: 0, pending: 0 };
    
    const filteredRepairs = repairs.filter(repair => {
      const repairDate = new Date(repair.date || repair.createdAt);
      return repairDate >= startDate && repairDate <= endDate;
    });
    
    return {
      count: filteredRepairs.length,
      revenue: filteredRepairs.reduce((sum, repair) => sum + (repair.agreedPrice || repair.price || 0), 0),
      pending: filteredRepairs.reduce((sum, repair) => sum + (repair.remaining || repair.balance || 0), 0)
    };
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Fetch all data with fallback
      const [
        products,
        customers,
        repairs,
        sales
      ] = await Promise.all([
        fetchData('https://inventoryapp-tucd.onrender.com/api/products'),
        fetchData('https://inventoryapp-tucd.onrender.com/api/customers'),
        fetchData('https://inventoryapp-tucd.onrender.com/api/repairs'),
        fetchData('https://inventoryapp-tucd.onrender.com/api/sales')
      ]);

      // Calculate products stats
      const totalProducts = Array.isArray(products) ? products.length : 0;
      const totalInventoryValue = Array.isArray(products) ? 
        products.reduce((sum, product) => 
          sum + ((product.costPrice || product.price || 0) * (product.quantity || product.stock || 0)), 0) : 0;
      const lowStockProducts = Array.isArray(products) ? 
        products.filter(product => (product.quantity || product.stock || 0) <= (product.minStock || 5)).length : 0;

      // Calculate customers stats
      const totalCustomers = Array.isArray(customers) ? customers.length : 0;

      // Calculate sales stats
      const todaySalesStats = calculateSalesStats(sales, today);
      const monthSalesStats = calculateSalesStats(sales, startOfMonth);

      // Calculate repair stats
      const totalRepairs = Array.isArray(repairs) ? repairs.length : 0;
      const totalRepairStats = calculateRepairStats(repairs, new Date(0)); // All time
      const todayRepairStats = calculateRepairStats(repairs, today);
      const monthRepairStats = calculateRepairStats(repairs, startOfMonth);

      // Calculate repair status counts
      const completedRepairs = Array.isArray(repairs) ? 
        repairs.filter(repair => (repair.remaining || repair.balance || 0) === 0).length : 0;
      const inProgressRepairs = Array.isArray(repairs) ? 
        repairs.filter(repair => (repair.remaining || repair.balance || 0) > 0).length : 0;

      // Prepare chart data
      const salesChartData = prepareSalesChartData(sales);
      const repairChartData = prepareRepairChartData(repairs);
      const modelDistributionData = prepareModelDistributionData(repairs);
      const topProductsData = prepareProductData(products);

      // Update all states
      setStats({
        products: totalProducts,
        totalInventoryValue,
        lowStockProducts,
        customers: totalCustomers,
        todayProfit: todaySalesStats.profit,
        todayRevenue: todaySalesStats.revenue,
        todaySales: todaySalesStats.count,
        monthlyProfit: monthSalesStats.profit,
        monthlyRevenue: monthSalesStats.revenue,
        monthlySales: monthSalesStats.count,
        totalRepairs,
        totalRepairRevenue: totalRepairStats.revenue,
        pendingAmount: totalRepairStats.pending,
        totalPaid: totalRepairStats.revenue - totalRepairStats.pending,
        todayRepairs: todayRepairStats.count,
        todayRepairRevenue: todayRepairStats.revenue,
        todayPending: todayRepairStats.pending,
        monthlyRepairs: monthRepairStats.count,
        monthlyRepairRevenue: monthRepairStats.revenue,
        completedRepairs,
        inProgressRepairs
      });
      
      setSalesData(salesChartData);
      setRevenueData(repairChartData);
      setModelData(modelDistributionData);
      setProductData(topProductsData);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Unable to load dashboard data, please try again later');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            📊 Comprehensive Management Dashboard
          </h1>
          <p className="text-gray-600">
            Integrated analysis of sales, products, and repair data
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      ) : (
        <>
          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <span className="text-2xl text-emerald-600">💰</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Today's Total Revenue</span>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(stats.todayRevenue + stats.todayRepairRevenue)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-emerald-600 font-medium">
                <span>Sales: {formatCurrency(stats.todayRevenue)} | Repairs: {formatCurrency(stats.todayRepairRevenue)}</span>
              </div>
            </div>

            {/* Total Products */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <span className="text-2xl text-blue-600">📦</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Total Products</span>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(stats.products)}</p>
                </div>
              </div>
              <div className="text-sm text-blue-600 font-medium">
                <span>Inventory Value: {formatCurrency(stats.totalInventoryValue)}</span>
              </div>
            </div>

            {/* Today's Profit */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <span className="text-2xl text-green-600">📈</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Today's Profit</span>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.todayProfit)}</p>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">
                <span>Profit Margin: {stats.todayRevenue > 0 ? ((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>

            {/* Active Repairs */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <span className="text-2xl text-amber-600">🔧</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">In Progress Repairs</span>
                  <p className="text-2xl font-bold text-gray-800">{formatNumber(stats.inProgressRepairs)}</p>
                </div>
              </div>
              <div className="text-sm text-amber-600 font-medium">
                <span>Pending Payment: {formatCurrency(stats.pendingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Middle Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Today's Sales */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Today's Sales</p>
                  <p className="text-3xl font-bold mt-2">{formatNumber(stats.todaySales)}</p>
                </div>
                <div className="text-4xl">🛒</div>
              </div>
              <div className="mt-4 text-sm opacity-90">
                Amount: {formatCurrency(stats.todayRevenue)}
              </div>
            </div>

            {/* Monthly Sales */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Monthly Sales</p>
                  <p className="text-3xl font-bold mt-2">{formatNumber(stats.monthlySales)}</p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
              <div className="mt-4 text-sm opacity-90">
                Amount: {formatCurrency(stats.monthlyRevenue)}
              </div>
            </div>

            {/* Today's Repairs */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Today's Repairs</p>
                  <p className="text-3xl font-bold mt-2">{formatNumber(stats.todayRepairs)}</p>
                </div>
                <div className="text-4xl">🔧</div>
              </div>
              <div className="mt-4 text-sm opacity-90">
                Revenue: {formatCurrency(stats.todayRepairRevenue)}
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Low Stock Products</p>
                  <p className="text-3xl font-bold mt-2">{formatNumber(stats.lowStockProducts)}</p>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
              <div className="mt-4 text-sm opacity-90">
                Need Restocking
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Trend Chart */}
            {salesData.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📊</span> Sales Trend (Last 7 Days)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        labelStyle={{ color: '#666' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Trend</h3>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No sales data available
                </div>
              </div>
            )}

            {/* Top Products Chart */}
            {productData.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏆</span> High Value Products (Top 5)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'value') {
                            return formatCurrency(value);
                          }
                          return value;
                        }}
                        labelStyle={{ color: '#666' }}
                      />
                      <Bar dataKey="value" name="Inventory Value" fill="#3b82f6" />
                      <Bar dataKey="quantity" name="Quantity" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">High Value Products</h3>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No product data available
                </div>
              </div>
            )}
          </div>

          {/* Repair Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Repair Revenue Trend Chart */}
            {revenueData.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🔄</span> Repair Revenue Trend (Last 7 Days)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'revenue' || name === 'pending') {
                            return formatCurrency(value);
                          }
                          return value;
                        }}
                        labelFormatter={(label) => `Date: ${label}`}
                        labelStyle={{ color: '#666' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Pending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Repair Revenue Trend</h3>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No repair data available
                </div>
              </div>
            )}

            {/* Top Phone Models Chart */}
            {modelData.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📱</span> Popular Repair Models (Top 5)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'revenue' || name === 'pending') {
                            return formatCurrency(value);
                          }
                          return value;
                        }}
                        labelStyle={{ color: '#666' }}
                      />
                      <Legend />
                      <Bar dataKey="repairs" name="Repair Count" fill="#3b82f6" />
                      <Bar dataKey="revenue" name="Total Revenue" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Repair Models</h3>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No repair data available
                </div>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sales Summary */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-emerald-600">💰</span> Sales Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Sales</span>
                  <span className="font-bold text-gray-800">{stats.todaySales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Revenue</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(stats.todayRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Profit</span>
                  <span className="font-bold text-green-700">{formatCurrency(stats.todayProfit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Price</span>
                  <span className="font-bold text-blue-700">
                    {stats.todaySales > 0 ? formatCurrency(stats.todayRevenue / stats.todaySales) : '$0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Repair Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-blue-600">🔧</span> Repair Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Repairs</span>
                  <span className="font-bold text-gray-800">{stats.todayRepairs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Revenue</span>
                  <span className="font-bold text-blue-700">{formatCurrency(stats.todayRepairRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-bold text-green-700">
                    {stats.totalRepairs > 0 ? ((stats.completedRepairs / stats.totalRepairs) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Price</span>
                  <span className="font-bold text-purple-700">
                    {stats.todayRepairs > 0 ? formatCurrency(stats.todayRepairRevenue / stats.todayRepairs) : '$0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Summary */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-purple-600">📦</span> Inventory Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-bold text-gray-800">{stats.products}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Value</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(stats.totalInventoryValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Low Stock</span>
                  <span className="font-bold text-amber-700">{stats.lowStockProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Price</span>
                  <span className="font-bold text-blue-700">
                    {stats.products > 0 ? formatCurrency(stats.totalInventoryValue / stats.products) : '$0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;