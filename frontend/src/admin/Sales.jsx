import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Sales = () => {
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
    endDate: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSales, setSelectedSales] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('New Sale');
  
  const API_URL = 'https://backendapp-qtb2.onrender.com/api/sales';

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
      
      const response = await axios.get(`${API_URL}?${params}`);
      setSales(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch sales');
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
          sellingPrice: product.costPrice * 1.2 // 20% markup by default
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
    setFilters({ startDate: '', endDate: '' });
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
    
    return { total, profit, costPrice };
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
      setError('All fields are required');
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
        setSuccessMessage('Sale updated successfully!');
      } else {
        // Create sale
        await axios.post(API_URL, {
          ...formData,
          total,
          profit
        });
        setSuccessMessage('Sale created successfully!');
      }
      
      // Reset and refresh
      resetForm();
      fetchSales();
      setShowSaleModal(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  // Edit sale
  const handleEdit = (sale) => {
    setFormData({
      productId: sale.productId._id,
      customerId: sale.customerId._id,
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
        setSuccessMessage('Sale deleted successfully!');
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
      setError('Please select sales to delete');
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
        setError('Failed to delete sales');
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
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
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
    
    return {
      totalRevenue,
      totalProfit,
      totalItems,
      averageSale: sales.length > 0 ? totalRevenue / sales.length : 0,
      averageProfit: sales.length > 0 ? totalProfit / sales.length : 0
    };
  };

  const stats = calculateStats();

  // Close sale modal
  const closeSaleModal = () => {
    setShowSaleModal(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              💰 Sales Management
            </h1>
            <p className="text-emerald-100 text-lg">
              Track sales, revenue, and profits
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-4 md:mt-0 bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
          >
            <span className="text-xl">+</span> New Sale
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

        

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📅</span> Filter Sales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-end gap-3">
              <button 
                onClick={applyFilters}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                Apply Filters
              </button>
              <button 
                onClick={clearFilters}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSales.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-2xl p-4 mb-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-lg">⚠️</span>
                <div>
                  <p className="font-medium text-red-800">{selectedSales.length} sale(s) selected</p>
                  <p className="text-sm text-red-600">These actions will affect all selected sales</p>
                </div>
              </div>
              <button 
                onClick={handleBulkDelete}
                className="mt-3 md:mt-0 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
              >
                <span>🗑️</span>
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Sales List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>📋</span> Sales List ({sales.length})
              </h2>
              
              {sales.length > 0 && (
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedSales.length === sales.length && sales.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sales...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg mb-4">
                No sales found. Create your first sale!
              </p>
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                + Create First Sale
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-green-50">
                  <tr>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold"></span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Product</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Customer</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Qty</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Price</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Total</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Profit</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Date</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr 
                      key={sale._id}
                      className="hover:bg-emerald-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedSales.includes(sale._id)}
                          onChange={() => handleSelectSale(sale._id)}
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                            <span className="text-lg">📦</span>
                          </div>
                          <span className="font-medium text-gray-800">
                            {getProductName(sale.productId)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {getCustomerName(sale.customerId).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-700">
                            {getCustomerName(sale.customerId)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                          {sale.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-gray-700">
                          {formatCurrency(sale.sellingPrice)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-emerald-700">
                          {formatCurrency(sale.total)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-mono font-bold ${sale.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatCurrency(sale.profit)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(sale)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(sale._id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

         
        </div>

        
       
      </div>

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className=""
              onClick={closeSaleModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {modalTitle}
                </h3>
                <button
                  onClick={closeSaleModal}
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
                  {/* Product and Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product *
                      </label>
                      <select
                        name="productId"
                        value={formData.productId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
                        <div className="mt-2 text-sm text-emerald-600">
                          Available Stock: <strong>{getAvailableStock()}</strong>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer *
                      </label>
                      <select
                        name="customerId"
                        value={formData.customerId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="Enter quantity"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Calculated Totals */}
                  {formData.productId && formData.quantity && formData.sellingPrice && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100">
                      <h4 className="font-bold text-gray-800 mb-4">Sale Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
                          <div className="text-sm text-gray-600">Cost Price</div>
                          <div className="text-lg font-bold text-gray-800 mt-1">
                            {formatCurrency(calculateTotals().costPrice)}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
                          <div className="text-sm text-gray-600">Total Amount</div>
                          <div className="text-xl font-bold text-emerald-700 mt-1">
                            {formatCurrency(calculateTotals().total)}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
                          <div className="text-sm text-gray-600">Estimated Profit</div>
                          <div className={`text-xl font-bold mt-1 ${calculateTotals().profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formatCurrency(calculateTotals().profit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    {editingId ? 'Update Sale' : 'Create Sale'}
                  </button>
                  <button
                    type="button"
                    onClick={closeSaleModal}
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

export default Sales;
