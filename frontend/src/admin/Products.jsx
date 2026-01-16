import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Product = () => {
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
  
  const API_URL = '/api/products';

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}?search=${searchTerm}`;
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
  }, [searchTerm, selectedCategory]);

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
      setError('All fields are required');
      return;
    }

    // Validate numeric fields
    if (parseFloat(formData.costPrice) <= 0) {
      setError('Cost price must be greater than 0');
      return;
    }

    if (parseFloat(formData.sellingPrice) <= 0) {
      setError('Selling price must be greater than 0');
      return;
    }

    if (parseFloat(formData.sellingPrice) < parseFloat(formData.costPrice)) {
      setError('Selling price must be greater than or equal to cost price');
      return;
    }

    if (parseInt(formData.quantity) < 0) {
      setError('Quantity cannot be negative');
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
        setSuccessMessage('Product updated successfully!');
      } else {
        // Create new product
        await axios.post(API_URL, formattedData);
        setSuccessMessage('Product created successfully!');
      }
      
      // Reset form and refresh list
      resetForm();
      fetchProducts();
      fetchStats();
      setShowProductModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    if (!stockUpdateData.amount || parseFloat(stockUpdateData.amount) <= 0) {
      setError('Please enter a valid amount');
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
      setError(err.response?.data?.message || 'Stock update failed');
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
        setError('Failed to delete product');
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select products to delete');
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
        setError('Failed to delete products');
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
    setError('');
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

  // Get stock status
  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  // Get stock status text
  const getStockText = (quantity) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
  };

  // Get stock icon
  const getStockIcon = (quantity) => {
    if (quantity === 0) return '🔴';
    if (quantity < 10) return '🟡';
    return '🟢';
  };

  // Calculate product metrics
  const calculateProductMetrics = (product) => {
    const totalValue = product.costPrice * product.quantity;
    const potentialRevenue = product.sellingPrice * product.quantity;
    const profitPerUnit = product.sellingPrice - product.costPrice;
    const profitMargin = ((profitPerUnit) / product.costPrice) * 100;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Inventory Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your products, stock, and profits
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-4 md:mt-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Add New Product
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto">
        {successMessage && (
          <div className="bg-gradient-to-r from-emerald-400 to-green-500 text-white p-4 rounded-xl mb-6 shadow-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-400 to-pink-500 text-white p-4 rounded-xl mb-6 shadow-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Products</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalProducts || 0}</p>
                </div>
                <span className="text-3xl">📦</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Inventory Value</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalInventoryValue || 0)}</p>
                </div>
                <span className="text-3xl">💰</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Potential Revenue</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalPotentialRevenue || 0)}</p>
                </div>
                <span className="text-3xl">📈</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Profit</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalPotentialProfit || 0)}</p>
                </div>
                <span className="text-3xl">💸</span>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="w-full md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedProducts.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2 whitespace-nowrap"
              >
                <span>🗑️</span>
                Delete Selected ({selectedProducts.length})
              </button>
            )}
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>📋</span> Products List ({products.length})
              </h2>
              
              {products.length > 0 && (
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="selectAll" className="text-gray-600 font-medium">
                    Select All
                  </label>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg mb-4">
                No products found. Add your first product!
              </p>
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                + Add First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <tr>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold"></span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Product Details</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Category</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Pricing</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Stock</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Profit</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const metrics = calculateProductMetrics(product);
                    return (
                      <tr 
                        key={product._id}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => handleSelectProduct(product._id)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white">
                              <span className="text-sm">📦</span>
                            </div>
                            <div>
                              <span className="font-bold text-gray-800 block">
                                {product.name}
                              </span>
                              <span className="text-sm text-gray-500 font-mono">
                                SKU: {product.sku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Cost:</span>
                              <span className="font-mono font-medium text-gray-700">
                                {formatCurrency(product.costPrice)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Sell:</span>
                              <span className="font-mono font-medium text-emerald-700">
                                {formatCurrency(product.sellingPrice)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getStockIcon(product.quantity)}</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStockStatus(product.quantity)}`}>
                                {product.quantity}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Value: {formatCurrency(metrics.totalValue)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Margin:</span>
                              <span className={`font-medium ${metrics.profitMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {formatPercentage(metrics.profitMargin)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Profit:</span>
                              <span className="font-mono font-medium text-emerald-700">
                                {formatCurrency(metrics.totalPotentialProfit)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-cyan-200 transition-all duration-200"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleStockUpdateClick(product)}
                              className="p-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-lg hover:from-emerald-200 hover:to-green-200 transition-all duration-200"
                              title="Update Stock"
                            >
                              📈
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="p-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 rounded-lg hover:from-red-200 hover:to-pink-200 transition-all duration-200"
                              title="Delete"
                            >
                              🗑️
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
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Total: {products.length} products • Inventory Value: {formatCurrency(stats?.totalInventoryValue || 0)}</p>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className=""
              onClick={closeProductModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {modalTitle}
                </h3>
                <button
                  onClick={closeProductModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter product name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU *
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="Enter SKU"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="Enter category"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Calculated Metrics */}
                  {(formData.costPrice || formData.sellingPrice || formData.quantity) && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Total Value:</span>
                          <p className="text-lg font-bold text-blue-700">
                            {formatCurrency(calculateFormMetrics().totalValue)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Profit Margin:</span>
                          <p className={`text-lg font-bold ${calculateFormMetrics().profitMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formatPercentage(calculateFormMetrics().profitMargin)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Profit per Unit:</span>
                          <p className={`text-lg font-bold ${calculateFormMetrics().profitPerUnit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formatCurrency(calculateFormMetrics().profitPerUnit)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Total Profit:</span>
                          <p className={`text-lg font-bold ${calculateFormMetrics().totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    {editingId ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={closeProductModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal - Same as before */}
      {showStockModal && selectedProductForStock && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className=""
              onClick={closeStockModal}
            ></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>📈</span> Update Stock
                </h3>
                <button
                  onClick={closeStockModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Product Info */}
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                    <span className="text-lg">📦</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{selectedProductForStock.name}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        SKU: <strong>{selectedProductForStock.sku}</strong>
                      </span>
                      <span className="text-sm text-gray-600">
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Action
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${stockUpdateData.action === 'add' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="radio"
                        name="action"
                        value="add"
                        checked={stockUpdateData.action === 'add'}
                        onChange={handleStockUpdateChange}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">➕</span>
                        <span className="font-medium">Add Stock</span>
                      </div>
                    </label>
                    <label className={`flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${stockUpdateData.action === 'remove' ? 'bg-red-50 border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="radio"
                        name="action"
                        value="remove"
                        checked={stockUpdateData.action === 'remove'}
                        onChange={handleStockUpdateChange}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">➖</span>
                        <span className="font-medium">Remove Stock</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={stockUpdateData.amount}
                    onChange={handleStockUpdateChange}
                    placeholder="Enter amount"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                {/* Preview */}
                {stockUpdateData.amount && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">New Quantity:</span>
                      <span className={`text-lg font-bold ${stockUpdateData.action === 'add' ? 'text-emerald-700' : 'text-red-700'}`}>
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
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                  Update Stock
                </button>
                <button
                  onClick={closeStockModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default Product;