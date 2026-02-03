import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  RefreshCw, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  ShoppingCart,
  Calendar,
  BarChart2,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Dashboard = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    products: 0,
    totalInventoryValue: 0,
    lowStockProducts: 0,
    customers: 0,
    todayProfit: 0,
    todayRevenue: 0,
    todaySales: 0,
    monthlyProfit: 0,
    monthlyRevenue: 0,
    monthlySales: 0,
  });
  
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const prepareSalesChartData = (sales) => {
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
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

  const prepareProductData = (products) => {
    if (!Array.isArray(products)) return [];
    
    const productsWithValue = products.map(product => ({
      name: product.name?.length > 12 ? product.name.substring(0, 12) + '...' : product.name || 'Unnamed Product',
      value: (product.costPrice || product.price || 0) * (product.quantity || product.stock || 0),
      quantity: product.quantity || product.stock || 0,
      costPrice: product.costPrice || product.price || 0
    }));
    
    return productsWithValue
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const fetchData = async (url, fallbackData = []) => {
    try {
      const response = await axios.get(url);
      return response.data.data || response.data || fallbackData;
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error.message);
      return fallbackData;
    }
  };

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

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const [products, customers, sales] = await Promise.all([
        fetchData('https://posapp-o3d4.onrender.com/api/user/loginuser/api/products'),
        fetchData('https://posapp-o3d4.onrender.com/api/user/loginuser/api/customers'),
        fetchData('https://posapp-o3d4.onrender.com/api/user/loginuser/api/sales')
      ]);

      const totalProducts = Array.isArray(products) ? products.length : 0;
      const totalInventoryValue = Array.isArray(products) ? 
        products.reduce((sum, product) => 
          sum + ((product.costPrice || product.price || 0) * (product.quantity || product.stock || 0)), 0) : 0;
      const lowStockProducts = Array.isArray(products) ? 
        products.filter(product => (product.quantity || product.stock || 0) <= (product.minStock || 5)).length : 0;

      const totalCustomers = Array.isArray(customers) ? customers.length : 0;
      const todaySalesStats = calculateSalesStats(sales, today);
      const monthSalesStats = calculateSalesStats(sales, startOfMonth);

      const salesChartData = prepareSalesChartData(sales);
      const topProductsData = prepareProductData(products);

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
      });
      
      setSalesData(salesChartData);
      setProductData(topProductsData);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Unable to load dashboard data, please try again later');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Card classes based on theme
  const statCardClasses = (color = 'emerald') => {
    const lightColors = {
      emerald: 'bg-gradient-to-br from-emerald-50 to-white border border-emerald-100',
      blue: 'bg-gradient-to-br from-blue-50 to-white border border-blue-100',
      green: 'bg-gradient-to-br from-green-50 to-white border border-green-100',
      purple: 'bg-gradient-to-br from-purple-50 to-white border border-purple-100',
    };
    
    const darkColors = {
      emerald: 'bg-gradient-to-br from-emerald-900/20 to-gray-900 border border-emerald-800/30',
      blue: 'bg-gradient-to-br from-blue-900/20 to-gray-900 border border-blue-800/30',
      green: 'bg-gradient-to-br from-green-900/20 to-gray-900 border border-green-800/30',
      purple: 'bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-800/30',
    };
    
    return `
      rounded-2xl p-4 md:p-6 shadow-lg transition-all duration-300 hover:shadow-xl
      ${theme === 'dark' ? darkColors[color] : lightColors[color]}
    `;
  };

  const gradientCardClasses = (from, to) => {
    return `
      rounded-2xl p-4 md:p-6 shadow-lg text-white
      bg-gradient-to-r ${from} ${to}
    `;
  };

  const chartContainerClasses = () => {
    return `
      rounded-2xl p-4 md:p-6 shadow-lg border transition-all duration-300
      ${theme === 'dark' 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-white border-green-100'
      }
    `;
  };

  const textColorClasses = {
    primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
    secondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
    muted: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    accent: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600',
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${textColorClasses.primary}`}>
            📊 Sales & Poss Dashboard
          </h1>
          <p className={textColorClasses.secondary}>
            Comprehensive analysis of sales and product data
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`
            px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 font-medium
            ${theme === 'dark' 
              ? 'bg-emerald-700 hover:bg-emerald-600 text-white' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-lg ${
          theme === 'dark' 
            ? 'bg-red-900/20 border border-red-800/30 text-red-400' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <AlertTriangle className="mr-2" size={20} />
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className={`animate-spin rounded-full h-16 w-16 border-b-2 ${
            theme === 'dark' ? 'border-emerald-500' : 'border-emerald-600'
          } mb-4`}></div>
          <p className={textColorClasses.secondary}>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Today's Revenue */}
            <div className={statCardClasses('emerald')}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 md:p-3 rounded-xl ${
                  theme === 'dark' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <DollarSign size={20} />
                </div>
                <div className="text-right">
                  <p className={`text-sm ${textColorClasses.muted}`}>Today's Revenue</p>
                  <p className={`text-xl md:text-2xl font-bold ${textColorClasses.primary}`}>
                    {formatCurrency(stats.todayRevenue)}
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium text-emerald-500">
                From {stats.todaySales} sales today
              </div>
            </div>

            {/* Total Products */}
            <div className={statCardClasses('blue')}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 md:p-3 rounded-xl ${
                  theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Package size={20} />
                </div>
                <div className="text-right">
                  <p className={`text-sm ${textColorClasses.muted}`}>Total Products</p>
                  <p className={`text-xl md:text-2xl font-bold ${textColorClasses.primary}`}>
                    {formatNumber(stats.products)}
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium text-blue-500">
                Value: {formatCurrency(stats.totalInventoryValue)}
              </div>
            </div>

            {/* Today's Profit */}
            <div className={statCardClasses('green')}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 md:p-3 rounded-xl ${
                  theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                  <TrendingUp size={20} />
                </div>
                <div className="text-right">
                  <p className={`text-sm ${textColorClasses.muted}`}>Today's Profit</p>
                  <p className={`text-xl md:text-2xl font-bold ${textColorClasses.primary}`}>
                    {formatCurrency(stats.todayProfit)}
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium text-green-500">
                Margin: {stats.todayRevenue > 0 ? ((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Customers */}
            <div className={statCardClasses('purple')}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 md:p-3 rounded-xl ${
                  theme === 'dark' ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
                }`}>
                  <Users size={20} />
                </div>
                <div className="text-right">
                  <p className={`text-sm ${textColorClasses.muted}`}>Total Customers</p>
                  <p className={`text-xl md:text-2xl font-bold ${textColorClasses.primary}`}>
                    {formatNumber(stats.customers)}
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium text-purple-500">
                Customer database
              </div>
            </div>
          </div>

          {/* Middle Gradient Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Today's Sales */}
            <div className={gradientCardClasses('from-emerald-500', 'to-green-600')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Today's Sales</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{formatNumber(stats.todaySales)}</p>
                </div>
                <ShoppingCart size={32} className="opacity-90" />
              </div>
              <div className="mt-3 text-sm opacity-90">
                Revenue: {formatCurrency(stats.todayRevenue)}
              </div>
            </div>

            {/* Monthly Sales */}
            <div className={gradientCardClasses('from-blue-500', 'to-cyan-600')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Monthly Sales</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{formatNumber(stats.monthlySales)}</p>
                </div>
                <Calendar size={32} className="opacity-90" />
              </div>
              <div className="mt-3 text-sm opacity-90">
                Revenue: {formatCurrency(stats.monthlyRevenue)}
              </div>
            </div>

            {/* Monthly Profit */}
            <div className={gradientCardClasses('from-amber-500', 'to-orange-600')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Monthly Profit</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{formatCurrency(stats.monthlyProfit)}</p>
                </div>
                <BarChart2 size={32} className="opacity-90" />
              </div>
              <div className="mt-3 text-sm opacity-90">
                Margin: {stats.monthlyRevenue > 0 ? ((stats.monthlyProfit / stats.monthlyRevenue) * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className={gradientCardClasses('from-red-500', 'to-pink-600')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Low Stock</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{formatNumber(stats.lowStockProducts)}</p>
                </div>
                <AlertTriangle size={32} className="opacity-90" />
              </div>
              <div className="mt-3 text-sm opacity-90">
                Need Restocking
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Sales Trend Chart */}
            <div className={chartContainerClasses()}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textColorClasses.primary}`}>
                <Activity size={20} />
                Sales Trend (Last 7 Days)
              </h3>
              <div className="h-72 md:h-80">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} 
                      />
                      <XAxis 
                        dataKey="date" 
                        stroke={theme === 'dark' ? '#9ca3af' : '#666'} 
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#9ca3af' : '#666'}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                        }}
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
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <BarChart2 size={48} className="mb-3 opacity-50" />
                    <p>No sales data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Products Chart */}
            <div className={chartContainerClasses()}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textColorClasses.primary}`}>
                <PieChart size={20} />
                High Value Products (Top 5)
              </h3>
              <div className="h-72 md:h-80">
                {productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productData}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} 
                      />
                      <XAxis 
                        dataKey="name" 
                        stroke={theme === 'dark' ? '#9ca3af' : '#666'} 
                        angle={-45} 
                        textAnchor="end" 
                        height={60} 
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#9ca3af' : '#666'}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'value') {
                            return formatCurrency(value);
                          }
                          return value;
                        }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                        }}
                      />
                      <Bar dataKey="value" name="Inventory Value" fill="#3b82f6" />
                      <Bar dataKey="quantity" name="Quantity" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <Package size={48} className="mb-3 opacity-50" />
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Sales Summary */}
            <div className={`rounded-2xl p-4 md:p-6 border transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-emerald-900/10 border-emerald-800/30' 
                : 'bg-emerald-50 border-emerald-100'
            }`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${textColorClasses.primary}`}>
                <Zap size={18} className="text-emerald-500" />
                Sales Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Today's Sales</span>
                  <span className={`font-bold ${textColorClasses.primary}`}>
                    {stats.todaySales}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Today's Revenue</span>
                  <span className="font-bold text-emerald-500">
                    {formatCurrency(stats.todayRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Today's Profit</span>
                  <span className="font-bold text-green-500">
                    {formatCurrency(stats.todayProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Average Price</span>
                  <span className="font-bold text-blue-500">
                    {stats.todaySales > 0 ? formatCurrency(stats.todayRevenue / stats.todaySales) : '$0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Performance */}
            <div className={`rounded-2xl p-4 md:p-6 border transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-blue-900/10 border-blue-800/30' 
                : 'bg-blue-50 border-blue-100'
            }`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${textColorClasses.primary}`}>
                <Calendar size={18} className="text-blue-500" />
                Monthly Performance
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Monthly Sales</span>
                  <span className={`font-bold ${textColorClasses.primary}`}>
                    {stats.monthlySales}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Monthly Revenue</span>
                  <span className="font-bold text-blue-500">
                    {formatCurrency(stats.monthlyRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Monthly Profit</span>
                  <span className="font-bold text-green-500">
                    {formatCurrency(stats.monthlyProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Avg Daily Sales</span>
                  <span className="font-bold text-purple-500">
                    {(stats.monthlySales / new Date().getDate()).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Summary */}
            <div className={`rounded-2xl p-4 md:p-6 border transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-purple-900/10 border-purple-800/30' 
                : 'bg-purple-50 border-purple-100'
            }`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${textColorClasses.primary}`}>
                <Package size={18} className="text-purple-500" />
                Inventory Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Total Products</span>
                  <span className={`font-bold ${textColorClasses.primary}`}>
                    {stats.products}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Total Value</span>
                  <span className="font-bold text-emerald-500">
                    {formatCurrency(stats.totalInventoryValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Low Stock</span>
                  <span className="font-bold text-amber-500">
                    {stats.lowStockProducts}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={textColorClasses.secondary}>Average Price</span>
                  <span className="font-bold text-blue-500">
                    {stats.products > 0 ? formatCurrency(stats.totalInventoryValue / stats.products) : '$0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className={`rounded-2xl p-4 md:p-6 border transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-green-100'
          }`}>
            <h4 className={`font-bold mb-4 ${textColorClasses.primary}`}>
              Performance Insights
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-xl md:text-2xl font-bold mb-1 ${
                  stats.todaySales > stats.monthlySales / new Date().getDate() ? 'text-green-500' : 'text-amber-500'
                }`}>
                  {stats.todaySales}
                </div>
                <p className={textColorClasses.muted}>Today vs Daily Avg</p>
              </div>
              <div className="text-center">
                <div className={`text-xl md:text-2xl font-bold mb-1 ${
                  stats.todayProfit > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stats.todayProfit > 0 ? '+' : ''}{formatCurrency(stats.todayProfit)}
                </div>
                <p className={textColorClasses.muted}>Daily Profit</p>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold mb-1 text-blue-500">
                  {stats.monthlySales > 0 ? (stats.monthlyRevenue / stats.monthlySales).toFixed(0) : 0}
                </div>
                <p className={textColorClasses.muted}>Avg Sale Value</p>
              </div>
              <div className="text-center">
                <div className={`text-xl md:text-2xl font-bold mb-1 ${
                  stats.lowStockProducts === 0 ? 'text-green-500' : 'text-amber-500'
                }`}>
                  {stats.lowStockProducts === 0 ? 'Good' : 'Alert'}
                </div>
                <p className={textColorClasses.muted}>Stock Status</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;