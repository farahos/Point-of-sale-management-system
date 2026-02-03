import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Package, 
  Search, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  BarChart3,
  X,
  PlusCircle,
  MinusCircle,
  Tag,
  Hash,
  ShoppingBag
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Product = () => {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    quantity: ''
  });
  const [stockUpdateData, setStockUpdateData] = useState({
    action: 'add',
    amount: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [stats, setStats] = useState(null);
  const [modalTitle, setModalTitle] = useState('Add New Product');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const API_URL = '/api/products';

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

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}?search=${searchTerm}&sort=${sortBy}&order=${sortOrder}`;
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      const response = await axios.get(url);
      setProducts(response.data.data || []);
      
      if (response.data.filters?.categories) {
        setCategories(response.data.filters.categories);
      }
      
      if (response.data.statistics) {
        setStats(response.data.statistics);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle stock update input changes
  const handleStockUpdateChange = (e) => {
    const { name, value } = e.target;
    setStockUpdateData({
      ...stockUpdateData,
      [name]: value
    });
  };

  // Handle form submission (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'sku', 'category', 'costPrice', 'sellingPrice', 'quantity'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('All fields are required');
      return;
    }

    // Validate numeric fields
    if (parseFloat(formData.costPrice) <= 0) {
      toast.error('Cost price must be greater than 0');
      return;
    }

    if (parseFloat(formData.sellingPrice) <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    if (parseFloat(formData.sellingPrice) < parseFloat(formData.costPrice)) {
      toast.error('Selling price must be greater than or equal to cost price');
      return;
    }

    if (parseInt(formData.quantity) < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    try {
      const formattedData = {
        ...formData,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        sku: formData.sku.toUpperCase()
      };

      if (editingId) {
        // Update existing product
        await axios.put(`${API_URL}/${editingId}`, formattedData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        await axios.post(API_URL, formattedData);
        toast.success('Product created successfully!');
      }
      
      // Reset form and refresh list
      resetForm();
      fetchProducts();
      fetchStats();
      setShowProductModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    if (!stockUpdateData.amount || parseFloat(stockUpdateData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await axios.patch(
        `${API_URL}/${selectedProductForStock._id}/quantity`,
        stockUpdateData
      );
      
      setSuccessMessage(`Stock ${stockUpdateData.action === 'add' ? 'added to' : 'removed from'} product successfully!`);
      setShowStockModal(false);
      setStockUpdateData({ action: 'add', amount: '' });
      setSelectedProductForStock(null);
      
      fetchProducts();
      fetchStats();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock update failed');
    }
  };

  // Open Add Product Modal
  const openAddModal = () => {
    resetForm();
    setModalTitle('Add New Product');
    setShowProductModal(true);
  };

  // Edit product
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity
    });
    setEditingId(product._id);
    setModalTitle('Edit Product');
    setShowProductModal(true);
  };

  // Open stock update modal
  const handleStockUpdateClick = (product) => {
    setSelectedProductForStock(product);
    setStockUpdateData({ action: 'add', amount: '' });
    setShowStockModal(true);
  };

  // Delete product
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccessMessage('Product deleted successfully!');
        fetchProducts();
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      try {
        await axios.delete(API_URL, { data: { ids: selectedProducts } });
        setSuccessMessage(`${selectedProducts.length} product(s) deleted successfully!`);
        setSelectedProducts([]);
        fetchProducts();
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        toast.error('Failed to delete products');
      }
    }
  };

  // Handle product selection for bulk operations
  const handleSelectProduct = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product._id));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ 
      name: '', 
      sku: '', 
      category: '', 
      costPrice: '', 
      sellingPrice: '', 
      quantity: '' 
    });
    setEditingId(null);
    toast.error('');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Get stock status classes
  const getStockStatusClasses = (quantity) => {
    if (quantity === 0) {
      return theme === 'dark' 
        ? 'bg-red-900/30 text-red-400 border border-red-800/50' 
        : 'bg-red-100 text-red-800';
    }
    if (quantity < 10) {
      return theme === 'dark' 
        ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50' 
        : 'bg-yellow-100 text-yellow-800';
    }
    return theme === 'dark' 
      ? 'bg-green-900/30 text-green-400 border border-green-800/50' 
      : 'bg-emerald-100 text-emerald-800';
  };

  // Get stock status text
  const getStockText = (quantity) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
  };

  // Calculate product metrics
  const calculateProductMetrics = (product) => {
    const totalValue = product.costPrice * product.quantity;
    const potentialRevenue = product.sellingPrice * product.quantity;
    const profitPerUnit = product.sellingPrice - product.costPrice;
    const profitMargin = product.costPrice > 0 ? ((profitPerUnit) / product.costPrice) * 100 : 0;
    const totalPotentialProfit = profitPerUnit * product.quantity;

    return {
      totalValue,
      potentialRevenue,
      profitPerUnit,
      profitMargin,
      totalPotentialProfit
    };
  };

  // Close product modal
  const closeProductModal = () => {
    setShowProductModal(false);
    resetForm();
  };

  // Close stock modal
  const closeStockModal = () => {
    setShowStockModal(false);
    setStockUpdateData({ action: 'add', amount: '' });
    setSelectedProductForStock(null);
  };

  // Calculate form metrics
  const calculateFormMetrics = () => {
    const costPrice = parseFloat(formData.costPrice) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const quantity = parseFloat(formData.quantity) || 0;
    
    const totalValue = costPrice * quantity;
    const profitPerUnit = sellingPrice - costPrice;
    const profitMargin = costPrice > 0 ? (profitPerUnit / costPrice) * 100 : 0;
    const totalProfit = profitPerUnit * quantity;
    
    return { totalValue, profitPerUnit, profitMargin, totalProfit };
  };

  // Sort products
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Render stats card
  const renderStatCard = (title, value, icon, color) => {
    const darkColors = {
      blue: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
      green: 'bg-green-900/30 text-green-400 border-green-800/50',
      purple: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
      amber: 'bg-amber-900/30 text-amber-400 border-amber-800/50',
    };
    
    const lightColors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
    };

    const colors = theme === 'dark' ? darkColors : lightColors;
    
    return (
      <div className={`rounded-xl p-4 border ${colors[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${colors[color]} bg-opacity-30`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="opacity-50">↕️</span>;
    return sortOrder === 'asc' ? '↑' : '↓';
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
              Product Management
            </h1>
            <p className="opacity-80">
              Manage your products, stock, and profits
            </p>
          </div>
          <button
            onClick={openAddModal}
            className={buttonClasses('primary')}
          >
            <Plus size={20} />
            Add New Product
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
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {renderStatCard(
              "Total Products", 
              stats.totalProducts || 0, 
              <Package size={24} />,
              "blue"
            )}
            {renderStatCard(
              "Inventory Value", 
              formatCurrency(stats.totalInventoryValue || 0), 
              <DollarSign size={24} />,
              "green"
            )}
            {renderStatCard(
              "Potential Revenue", 
              formatCurrency(stats.totalPotentialRevenue || 0), 
              <BarChart3 size={24} />,
              "purple"
            )}
            {renderStatCard(
              "Total Profit", 
              formatCurrency(stats.totalPotentialProfit || 0), 
              <TrendingUp size={24} />,
              "amber"
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className={`rounded-xl p-4 md:p-6 mb-6 border ${cardClasses()}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={20} className="opacity-50" />
                </div>
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()} w-full sm:w-auto`}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()} w-full sm:w-auto`}
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="quantity">Sort by Quantity</option>
                  <option value="profit">Sort by Profit</option>
                </select>
              </div>
            </div>
            
            {selectedProducts.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className={buttonClasses('danger')}
              >
                <Trash2 size={20} />
                Delete Selected ({selectedProducts.length})
              </button>
            )}
          </div>
        </div>

        {/* Products Grid/List View */}
        <div className={`rounded-xl border overflow-hidden ${cardClasses()}`}>
          <div className="p-4 md:p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={24} />
                Products List ({products.length})
              </h2>
              
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded focus:ring-green-500"
                  />
                  <label htmlFor="selectAll" className="text-sm">
                    Select All
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-600 text-white' : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-600 text-white' : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                  >
                    List
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
              <p className="mt-4 opacity-80">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4">
                <Package size={64} className="mx-auto opacity-50" />
              </div>
              <p className="text-lg mb-4 opacity-80">
                No products found. Add your first product!
              </p>
              <button
                onClick={openAddModal}
                className={buttonClasses('primary')}
              >
                <Plus size={20} />
                Add First Product
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
              {products.map((product) => {
                const metrics = calculateProductMetrics(product);
                return (
                  <div 
                    key={product._id}
                    className={`rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Product Header */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => handleSelectProduct(product._id)}
                            className="w-5 h-5 rounded focus:ring-green-500"
                          />
                          <span className="font-bold text-lg truncate">
                            {product.name}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStockStatusClasses(product.quantity)}`}>
                          {product.quantity}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Hash size={14} className="opacity-60" />
                        <span className="text-sm opacity-80 font-mono">
                          {product.sku}
                        </span>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="opacity-60" />
                          <span className="px-2 py-1 rounded text-sm bg-opacity-20">
                            {product.category}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs opacity-70">Cost Price</p>
                            <p className="font-medium">
                              {formatCurrency(product.costPrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">Selling Price</p>
                            <p className="font-medium text-green-500">
                              {formatCurrency(product.sellingPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm opacity-70">Profit Margin</span>
                            <span className={`font-medium ${metrics.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercentage(metrics.profitMargin)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm opacity-70">Total Value</span>
                            <span className="font-medium">
                              {formatCurrency(metrics.totalValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
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
                        onClick={() => handleStockUpdateClick(product)}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                          theme === 'dark' 
                            ? 'bg-green-700 hover:bg-green-600' 
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        <PlusCircle size={16} />
                        Stock
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
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
            // List View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th className="py-4 px-6 text-left">
                      <span className="font-semibold"></span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button 
                        onClick={() => handleSort('name')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Product Details
                        <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button 
                        onClick={() => handleSort('category')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Category
                        <SortIcon field="category" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button 
                        onClick={() => handleSort('price')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Pricing
                        <SortIcon field="price" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button 
                        onClick={() => handleSort('quantity')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Stock
                        <SortIcon field="quantity" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button 
                        onClick={() => handleSort('profit')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Profit
                        <SortIcon field="profit" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="font-semibold">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => {
                    const metrics = calculateProductMetrics(product);
                    return (
                      <tr 
                        key={product._id}
                        className={theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}
                      >
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => handleSelectProduct(product._id)}
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
                              <span className="font-bold block">
                                {product.name}
                              </span>
                              <span className="text-sm opacity-80 font-mono">
                                SKU: {product.sku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-purple-900/30 text-purple-400' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm opacity-70">Cost:</span>
                              <span className="font-medium">
                                {formatCurrency(product.costPrice)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm opacity-70">Sell:</span>
                              <span className="font-medium text-green-500">
                                {formatCurrency(product.sellingPrice)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStockStatusClasses(product.quantity)}`}>
                                {product.quantity}
                              </span>
                            </div>
                            <div className="text-sm opacity-70">
                              Value: {formatCurrency(metrics.totalValue)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm opacity-70">Margin:</span>
                              <span className={`font-medium ${metrics.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercentage(metrics.profitMargin)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm opacity-70">Profit:</span>
                              <span className="font-medium text-green-500">
                                {formatCurrency(metrics.totalPotentialProfit)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
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
                              onClick={() => handleStockUpdateClick(product)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark' 
                                  ? 'bg-green-700 hover:bg-green-600' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700'
                              }`}
                              title="Update Stock"
                            >
                              <PlusCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
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
          )}
        </div>

        {/* Footer */}
        <div className={`mt-6 text-center text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>Total: {products.length} products • Inventory Value: {formatCurrency(stats?.totalInventoryValue || 0)}</p>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div 
              className="fixed bg-opacity-50 transition-opacity"
              onClick={closeProductModal}
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
                  onClick={closeProductModal}
                  className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter product name"
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        SKU *
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="Enter SKU"
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 uppercase ${inputClasses()}`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="Enter category"
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Cost Price ($) *
                      </label>
                      <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
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
                      placeholder="0"
                      min="0"
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                      required
                    />
                  </div>

                  {/* Calculated Metrics */}
                  {(formData.costPrice || formData.sellingPrice || formData.quantity) && (
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700/30 border-gray-600' 
                        : 'bg-blue-50 border-blue-100'
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium opacity-80">Total Value:</span>
                          <p className="text-lg font-bold text-blue-500">
                            {formatCurrency(calculateFormMetrics().totalValue)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium opacity-80">Profit Margin:</span>
                          <p className={`text-lg font-bold ${
                            calculateFormMetrics().profitMargin >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatPercentage(calculateFormMetrics().profitMargin)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium opacity-80">Profit per Unit:</span>
                          <p className={`text-lg font-bold ${
                            calculateFormMetrics().profitPerUnit >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatCurrency(calculateFormMetrics().profitPerUnit)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium opacity-80">Total Profit:</span>
                          <p className={`text-lg font-bold ${
                            calculateFormMetrics().totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatCurrency(calculateFormMetrics().totalProfit)}
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
                    {editingId ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={closeProductModal}
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

      {/* Stock Update Modal */}
      {showStockModal && selectedProductForStock && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div 
              className="fixed bg-opacity-50 transition-opacity"
              onClick={closeStockModal}
            ></div>

            <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-xl shadow-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <PlusCircle size={24} />
                  Update Stock
                </h3>
                <button
                  onClick={closeStockModal}
                  className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Product Info */}
              <div className={`mb-6 p-4 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700/30 border-gray-600' 
                  : 'bg-green-50 border-green-100'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-green-700' : 'bg-green-100'
                  }`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">{selectedProductForStock.name}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <span className="text-sm opacity-80">
                        SKU: <strong>{selectedProductForStock.sku}</strong>
                      </span>
                      <span className="text-sm opacity-80">
                        Current: <strong>{selectedProductForStock.quantity}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Update Form */}
              <div className="space-y-6">
                {/* Action Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Action
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      stockUpdateData.action === 'add' 
                        ? theme === 'dark'
                          ? 'bg-green-700 border-green-500 ring-2 ring-green-800'
                          : 'bg-green-50 border-green-500 ring-2 ring-green-200'
                        : theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    } border`}>
                      <input
                        type="radio"
                        name="action"
                        value="add"
                        checked={stockUpdateData.action === 'add'}
                        onChange={handleStockUpdateChange}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <PlusCircle size={24} />
                        <span className="font-medium">Add Stock</span>
                      </div>
                    </label>
                    <label className={`flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      stockUpdateData.action === 'remove' 
                        ? theme === 'dark'
                          ? 'bg-red-700 border-red-500 ring-2 ring-red-800'
                          : 'bg-red-50 border-red-500 ring-2 ring-red-200'
                        : theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    } border`}>
                      <input
                        type="radio"
                        name="action"
                        value="remove"
                        checked={stockUpdateData.action === 'remove'}
                        onChange={handleStockUpdateChange}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <MinusCircle size={24} />
                        <span className="font-medium">Remove Stock</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={stockUpdateData.amount}
                    onChange={handleStockUpdateChange}
                    placeholder="Enter amount"
                    min="1"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                    required
                  />
                </div>

                {/* Preview */}
                {stockUpdateData.amount && (
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700/30 border-gray-600' 
                      : 'bg-blue-50 border-blue-100'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium opacity-80">New Quantity:</span>
                      <span className={`text-lg font-bold ${
                        stockUpdateData.action === 'add' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {stockUpdateData.action === 'add' 
                          ? selectedProductForStock.quantity + parseInt(stockUpdateData.amount)
                          : selectedProductForStock.quantity - parseInt(stockUpdateData.amount)
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleStockUpdate}
                  className={buttonClasses('primary') + ' flex-1'}
                >
                  Update Stock
                </button>
                <button
                  onClick={closeStockModal}
                  className={buttonClasses('secondary')}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;