import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ShoppingBag, 
  Users, 
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Filter,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  X,
  TrendingDown,
  CreditCard,
  BarChart3,
  Download,
  Eye
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Sales = () => {
  const { theme } = useTheme();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: '',
    sellingPrice: ''
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    product: '',
    customer: '',
    minAmount: '',
    maxAmount: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSales, setSelectedSales] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('New Sale');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'profit', 'quantity'
  const [sortOrder, setSortOrder] = useState('desc');
  
  const API_URL = 'https://posapp-o3d4.onrender.com/api/sales';

  // Theme-based styling
  const cardClasses = () => {
    return theme === 'dark' 
      ? 'bg-gray-900 border-gray-800' 
      : 'bg-white border-gray-200';
  };

  const inputClasses = () => {
    return theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500';
  };

  const buttonClasses = (type = 'primary') => {
    const base = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2';
    
    switch (type) {
      case 'primary':
        return theme === 'dark'
          ? `${base} bg-green-600 hover:bg-green-700 text-white`
          : `${base} bg-green-600 hover:bg-green-700 text-white`;
      case 'secondary':
        return theme === 'dark'
          ? `${base} bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700`
          : `${base} bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300`;
      case 'danger':
        return theme === 'dark'
          ? `${base} bg-red-600 hover:bg-red-700 text-white`
          : `${base} bg-red-600 hover:bg-red-700 text-white`;
      default:
        return base;
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
  }, []);

  // Fetch sales with filters
  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.product) params.append('product', filters.product);
      if (filters.customer) params.append('customer', filters.customer);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      params.append('sort', sortBy);
      params.append('order', sortOrder);
      
      const response = await axios.get(`${API_URL}?${params}`);
      setSales(response.data.data || []);
      setError('');
    } catch (err) {
      toast.error('Failed to fetch sales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await axios.get('/api/products');
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Auto-calculate selling price if product is selected
    if (name === 'productId') {
      const product = products.find(p => p._id === value);
      if (product) {
        setFormData(prev => ({
          ...prev,
          sellingPrice: product.sellingPrice || (product.costPrice * 1.2) // Use selling price if exists, else 20% markup
        }));
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Apply filters
  const applyFilters = () => {
    fetchSales();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ 
      startDate: '', 
      endDate: '',
      product: '',
      customer: '',
      minAmount: '',
      maxAmount: ''
    });
    fetchSales();
  };

  // Calculate total and profit
  const calculateTotals = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const product = products.find(p => p._id === formData.productId);
    const costPrice = product ? product.costPrice : 0;
    
    const total = quantity * sellingPrice;
    const profit = (sellingPrice - costPrice) * quantity;
    const profitMargin = sellingPrice > 0 ? (profit / total) * 100 : 0;
    
    return { total, profit, costPrice, profitMargin };
  };

  // Open Add Sale Modal
  const openAddModal = () => {
    resetForm();
    setModalTitle('New Sale');
    setShowSaleModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.customerId || !formData.quantity || !formData.sellingPrice) {
      toast.error('All fields are required');
      return;
    }

    const { total, profit } = calculateTotals();

    try {
      if (editingId) {
        // Update sale
        await axios.put(`${API_URL}/${editingId}`, {
          ...formData,
          total,
          profit
        });
        toast.success('Sale updated successfully!');
      } else {
        // Create sale
        await axios.post(API_URL, {
          ...formData,
          total,
          profit
        });
        toast.success('Sale created successfully!');
      }
      
      // Reset and refresh
      resetForm();
      fetchSales();
      fetchProducts(); // Refresh products to update stock
      setShowSaleModal(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Edit sale
  const handleEdit = (sale) => {
    setFormData({
      productId: sale.productId._id || sale.productId,
      customerId: sale.customerId._id || sale.customerId,
      quantity: sale.quantity,
      sellingPrice: sale.sellingPrice
    });
    setEditingId(sale._id);
    setModalTitle('Edit Sale');
    setShowSaleModal(true);
  };

  // Delete sale
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        toast.success('Sale deleted successfully!');
        fetchSales();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete sale');
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedSales.length === 0) {
      toast.error('Please select sales to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedSales.length} sale(s)?`)) {
      try {
        await axios.delete(API_URL, { data: { ids: selectedSales } });
        setSuccessMessage(`${selectedSales.length} sale(s) deleted successfully!`);
        setSelectedSales([]);
        fetchSales();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        toast.error('Failed to delete sales');
      }
    }
  };

  // Handle sale selection
  const handleSelectSale = (id) => {
    if (selectedSales.includes(id)) {
      setSelectedSales(selectedSales.filter(saleId => saleId !== id));
    } else {
      setSelectedSales([...selectedSales, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedSales.length === sales.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(sales.map(sale => sale._id));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      productId: '',
      customerId: '',
      quantity: '',
      sellingPrice: ''
    });
    setEditingId(null);
    setError('');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get product name by ID
  const getProductName = (productId) => {
    if (typeof productId === 'object') return productId.name;
    const product = products.find(p => p._id === productId);
    return product ? product.name : 'Unknown';
  };

  // Get customer name by ID
  const getCustomerName = (customerId) => {
    if (typeof customerId === 'object') return customerId.name;
    const customer = customers.find(c => c._id === customerId);
    return customer ? customer.name : 'Unknown';
  };

  // Get stock for selected product
  const getAvailableStock = () => {
    const product = products.find(p => p._id === formData.productId);
    return product ? product.quantity : 0;
  };

  // Calculate sales statistics
  const calculateStats = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalSales = sales.length;
    
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    const averageProfit = totalSales > 0 ? totalProfit / totalSales : 0;
    const averageItems = totalSales > 0 ? totalItems / totalSales : 0;
    
    // Calculate today's sales
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => 
      new Date(sale.createdAt).toISOString().split('T')[0] === today
    );
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayProfit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
    
    return {
      totalRevenue,
      totalProfit,
      totalItems,
      totalSales,
      averageSale,
      averageProfit,
      averageItems,
      todayRevenue,
      todayProfit,
      todaySales: todaySales.length
    };
  };

  const stats = calculateStats();

  // Close sale modal
  const closeSaleModal = () => {
    setShowSaleModal(false);
    resetForm();
  };

  // Sort sales
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return <span className="opacity-50">↕️</span>;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Render stats card
  const renderStatCard = (title, value, icon, color, change = null) => {
    const darkColors = {
      green: 'bg-green-900/30 text-green-400 border-green-800/50',
      blue: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
      purple: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
      amber: 'bg-amber-900/30 text-amber-400 border-amber-800/50',
      emerald: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
    };
    
    const lightColors = {
      green: 'bg-green-50 text-green-600 border-green-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };

    const colors = theme === 'dark' ? darkColors : lightColors;
    
    return (
      <div className={`rounded-xl p-4 border ${colors[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <div className={`text-xs mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colors[color]} bg-opacity-30`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Sales Management
            </h1>
            <p className="opacity-80">
              Track sales, revenue, and profits
            </p>
          </div>
          <button
            onClick={openAddModal}
            className={buttonClasses('primary')}
          >
            <Plus size={20} />
            New Sale
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto">
        {successMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            theme === 'dark' 
              ? 'bg-green-900/30 border border-green-800 text-green-400' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            theme === 'dark' 
              ? 'bg-red-900/30 border border-red-800 text-red-400' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {renderStatCard(
            "Total Revenue", 
            formatCurrency(stats.totalRevenue), 
            <DollarSign size={24} />,
            "green"
          )}
          {renderStatCard(
            "Total Profit", 
            formatCurrency(stats.totalProfit), 
            <TrendingUp size={24} />,
            "emerald"
          )}
          {renderStatCard(
            "Total Sales", 
            stats.totalSales, 
            <ShoppingBag size={24} />,
            "blue"
          )}
          {renderStatCard(
            "Today's Revenue", 
            formatCurrency(stats.todayRevenue), 
            <CreditCard size={24} />,
            "purple",
            stats.todayRevenue > 0 ? 12 : 0
          )}
        </div>

        {/* Filters */}
        <div className={`rounded-xl p-4 md:p-6 mb-6 border ${cardClasses()}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Filter size={20} />
              Filter Sales
            </h3>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className={buttonClasses('primary')}
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className={buttonClasses('secondary')}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Product
              </label>
              <select
                name="product"
                value={filters.product}
                onChange={handleFilterChange}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Customer
              </label>
              <select
                name="customer"
                value={filters.customer}
                onChange={handleFilterChange}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              >
                <option value="">All Customers</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Min Amount
              </label>
              <input
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                placeholder="Minimum amount"
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Max Amount
              </label>
              <input
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                placeholder="Maximum amount"
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSales.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl border ${
            theme === 'dark' 
              ? 'bg-red-900/20 border-red-800/30' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-500" />
                <div>
                  <p className="font-medium">${selectedSales.length} sale(s) selected</p>
                  <p className="text-sm opacity-80">These actions will affect all selected sales</p>
                </div>
              </div>
              <button 
                onClick={handleBulkDelete}
                className={buttonClasses('danger') + ' mt-3 md:mt-0'}
              >
                <Trash2 size={20} />
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Sales Content */}
        <div className={`rounded-xl border overflow-hidden ${cardClasses()}`}>
          <div className="p-4 md:p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={24} />
                Sales List ({sales.length})
              </h2>
              
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                {sales.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectedSales.length === sales.length && sales.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded focus:ring-green-500"
                    />
                    <label htmlFor="selectAll" className="text-sm">
                      Select All
                    </label>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-green-600 text-white' : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-600 text-white' : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                  >
                    Grid
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${
                theme === 'dark' ? 'border-green-500' : 'border-green-600'
              }`}></div>
              <p className="mt-4 opacity-80">Loading sales...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4">
                <ShoppingBag size={64} className="mx-auto opacity-50" />
              </div>
              <p className="text-lg mb-4 opacity-80">
                No sales found. Create your first sale!
              </p>
              <button
                onClick={openAddModal}
                className={buttonClasses('primary')}
              >
                <Plus size={20} />
                Create First Sale
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
              {sales.map((sale) => {
                const profitMargin = sale.total > 0 ? (sale.profit / sale.total) * 100 : 0;
                return (
                  <div 
                    key={sale._id}
                    className={`rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Sale Header */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSales.includes(sale._id)}
                            onChange={() => handleSelectSale(sale._id)}
                            className="w-5 h-5 rounded focus:ring-green-500"
                          />
                          <span className="font-bold text-lg truncate">
                            {formatCurrency(sale.total)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sale.profit >= 0 
                            ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                            : theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                        }`}>
                          {sale.profit >= 0 ? '+' : ''}{formatCurrency(sale.profit)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm opacity-80">
                        {formatDate(sale.createdAt)}
                      </div>
                    </div>

                    {/* Sale Details */}
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm opacity-70">Product:</span>
                            <span className="font-medium">
                              {getProductName(sale.productId)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm opacity-70">Customer:</span>
                            <span className="font-medium">
                              {getCustomerName(sale.customerId)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm opacity-70">Quantity:</span>
                            <span className="font-bold">
                              {sale.quantity}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm opacity-70">Price:</span>
                            <span className="font-medium">
                              {formatCurrency(sale.sellingPrice)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm opacity-70">Total:</span>
                            <span className="font-bold text-green-500">
                              {formatCurrency(sale.total)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm opacity-70">Margin:</span>
                            <span className={`font-medium ${profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {profitMargin.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t flex gap-2">
                      <button
                        onClick={() => handleEdit(sale)}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sale._id)}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                          theme === 'dark' 
                            ? 'bg-red-700 hover:bg-red-600' 
                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Table View
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                    <tr>
                      <th className="py-4 px-6 text-left">
                        <span className="font-semibold"></span>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <button 
                          onClick={() => handleSort('product')}
                          className="font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                          Product
                          {getSortIcon('product')}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <button 
                          onClick={() => handleSort('customer')}
                          className="font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                          Customer
                          {getSortIcon('customer')}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <button 
                          onClick={() => handleSort('quantity')}
                          className="font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                          Qty
                          {getSortIcon('quantity')}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <button 
                          onClick={() => handleSort('price')}
                          className="font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                          Price
                          {getSortIcon('price')}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <button 
                          onClick={() => handleSort('amount')}
                          className="font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                          Total
                          {getSortIcon('amount')}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <button 
                          onClick={() => handleSort('profit')}
                          className="font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                          Profit
                          {getSortIcon('profit')}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <button 
                          onClick={() => handleSort('date')}
                          className="font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                          Date
                          {getSortIcon('date')}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left">
                        <span className="font-semibold">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sales.map((sale) => {
                      const profitMargin = sale.total > 0 ? (sale.profit / sale.total) * 100 : 0;
                      return (
                        <tr 
                          key={sale._id}
                          className={theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}
                        >
                          <td className="py-4 px-6">
                            <input
                              type="checkbox"
                              checked={selectedSales.includes(sale._id)}
                              onChange={() => handleSelectSale(sale._id)}
                              className="w-5 h-5 rounded focus:ring-green-500"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                <Package size={20} />
                              </div>
                              <div>
                                <span className="font-medium block">
                                  {getProductName(sale.productId)}
                                </span>
                                <span className="text-sm opacity-70">
                                  Qty: {sale.quantity}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <Users size={16} />
                              </div>
                              <span className="opacity-90">
                                {getCustomerName(sale.customerId)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {sale.quantity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-medium">
                              {formatCurrency(sale.sellingPrice)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-green-500">
                              {formatCurrency(sale.total)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <span className={`font-bold ${sale.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(sale.profit)}
                              </span>
                              <div className="text-xs opacity-70">
                                {profitMargin.toFixed(1)}% margin
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 opacity-80">
                              <Calendar size={14} />
                              {formatDateTime(sale.createdAt)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(sale)}
                                className={`p-2 rounded-lg transition-colors ${
                                  theme === 'dark' 
                                    ? 'bg-gray-700 hover:bg-gray-600' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(sale._id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  theme === 'dark' 
                                    ? 'bg-red-700 hover:bg-red-600' 
                                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                                }`}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Stats */}
              <div className={`p-4 border-t ${
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm opacity-80">
                    Showing {sales.length} sales • Total: {formatCurrency(stats.totalRevenue)} • Profit: {formatCurrency(stats.totalProfit)}
                  </div>
                  <div className="text-sm opacity-80">
                    Avg Sale: {formatCurrency(stats.averageSale)} • Avg Profit: {formatCurrency(stats.averageProfit)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div 
              className="fixed  bg-opacity-50 transition-opacity"
              onClick={closeSaleModal}
            ></div>

            <div className={`inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-xl shadow-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {modalTitle}
                </h3>
                <button
                  onClick={closeSaleModal}
                  className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Product and Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Product *
                      </label>
                      <select
                        name="productId"
                        value={formData.productId}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                        required
                        disabled={loadingProducts}
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} (Stock: {product.quantity})
                          </option>
                        ))}
                      </select>
                      {formData.productId && (
                        <div className="mt-2 text-sm text-green-500">
                          Available Stock: <strong>{getAvailableStock()}</strong>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Customer *
                      </label>
                      <select
                        name="customerId"
                        value={formData.customerId}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                        required
                      >
                        <option value="">Select Customer</option>
                        {customers.map(customer => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="Enter quantity"
                        min="1"
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Selling Price ($) *
                      </label>
                      <input
                        type="number"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                        required
                      />
                    </div>
                  </div>

                  {/* Calculated Totals */}
                  {formData.productId && formData.quantity && formData.sellingPrice && (
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700/30 border-gray-600' 
                        : 'bg-green-50 border-green-100'
                    }`}>
                      <h4 className={`font-bold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        Sale Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium opacity-80">Cost Price</span>
                          <p className="text-lg font-bold mt-1">
                            {formatCurrency(calculateTotals().costPrice)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium opacity-80">Total Amount</span>
                          <p className="text-xl font-bold text-green-500 mt-1">
                            {formatCurrency(calculateTotals().total)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium opacity-80">Estimated Profit</span>
                          <p className={`text-xl font-bold mt-1 ${
                            calculateTotals().profit >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatCurrency(calculateTotals().profit)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium opacity-80">Profit Margin</span>
                          <p className={`text-xl font-bold mt-1 ${
                            calculateTotals().profitMargin >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {calculateTotals().profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex gap-3">
                  <button
                    type="submit"
                    className={buttonClasses('primary') + ' flex-1'}
                  >
                    {editingId ? 'Update Sale' : 'Create Sale'}
                  </button>
                  <button
                    type="button"
                    onClick={closeSaleModal}
                    className={buttonClasses('secondary')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;