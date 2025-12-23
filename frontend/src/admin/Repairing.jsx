import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Repair = () => {
  const [repairs, setRepairs] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    problem: '',
    color: '',
    caseIncluded: '',
    battery: '',
    repairCost: '',
    amountPaid: '',
    repairStatus: 'pending' // pending, in_progress, completed
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRepairs, setSelectedRepairs] = useState([]);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('New Repair');
  
  const API_URL = '/api/repairs';

  // Fetch initial data
  useEffect(() => {
    fetchRepairs();
    fetchProducts();
    fetchCustomers();
  }, []);

  // Fetch repairs with filters
  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${API_URL}?${params}`);
      setRepairs(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch repairs');
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

    // Auto-calculate remaining balance
    if (name === 'repairCost' || name === 'amountPaid') {
      const cost = parseFloat(formData.repairCost) || 0;
      const paid = parseFloat(formData.amountPaid) || 0;
      setFormData(prev => ({
        ...prev,
        remainingBalance: Math.max(0, cost - paid)
      }));
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
    fetchRepairs();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', status: '' });
    fetchRepairs();
  };

  // Open Add Repair Modal
  const openAddModal = () => {
    resetForm();
    setModalTitle('New Repair');
    setShowRepairModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.customerId || !formData.problem || !formData.repairCost) {
      setError('Required fields: Product, Customer, Problem, and Repair Cost');
      return;
    }

    try {
      // First, get the product to check stock
      const productResponse = await axios.get(`/api/products/${formData.productId}`);
      const product = productResponse.data.data;
      
      if (!product || product.quantity <= 0) {
        setError('Product is out of stock');
        return;
      }

      // Calculate remaining balance
      const repairCost = parseFloat(formData.repairCost) || 0;
      const amountPaid = parseFloat(formData.amountPaid) || 0;
      const remainingBalance = Math.max(0, repairCost - amountPaid);

      if (editingId) {
        // Update repair
        await axios.put(`${API_URL}/${editingId}`, {
          ...formData,
          remainingBalance
        });
        setSuccessMessage('Repair updated successfully!');
      } else {
        // Create repair AND decrement product stock
        const repairResponse = await axios.post(API_URL, {
          ...formData,
          remainingBalance
        });
        
        // Decrement product quantity by 1 (like sales)
        await axios.put(`/api/products/${formData.productId}`, {
          quantity: product.quantity - 1
        });
        
        setSuccessMessage('Repair created and product stock updated successfully!');
      }
      
      // Reset and refresh
      resetForm();
      fetchRepairs();
      fetchProducts(); // Refresh products to update stock display
      setShowRepairModal(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  // Edit repair
  const handleEdit = (repair) => {
    setFormData({
      productId: repair.productId._id || repair.productId,
      customerId: repair.customerId._id || repair.customerId,
      problem: repair.problem,
      color: repair.color || '',
      caseIncluded: repair.caseIncluded || '',
      battery: repair.battery || '',
      repairCost: repair.repairCost,
      amountPaid: repair.amountPaid || '',
      repairStatus: repair.repairStatus || 'pending'
    });
    setEditingId(repair._id);
    setModalTitle('Edit Repair');
    setShowRepairModal(true);
  };

  // Delete repair
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this repair?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccessMessage('Repair deleted successfully!');
        fetchRepairs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete repair');
      }
    }
  };

  // Update repair status
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/${id}`, {
        repairStatus: newStatus
      });
      setSuccessMessage(`Repair status updated to ${newStatus}!`);
      fetchRepairs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update repair status');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedRepairs.length === 0) {
      setError('Please select repairs to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedRepairs.length} repair(s)?`)) {
      try {
        await axios.delete(API_URL, { data: { ids: selectedRepairs } });
        setSuccessMessage(`${selectedRepairs.length} repair(s) deleted successfully!`);
        setSelectedRepairs([]);
        fetchRepairs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete repairs');
      }
    }
  };

  // Handle repair selection
  const handleSelectRepair = (id) => {
    if (selectedRepairs.includes(id)) {
      setSelectedRepairs(selectedRepairs.filter(repairId => repairId !== id));
    } else {
      setSelectedRepairs([...selectedRepairs, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRepairs.length === repairs.length) {
      setSelectedRepairs([]);
    } else {
      setSelectedRepairs(repairs.map(repair => repair._id));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      productId: '',
      customerId: '',
      problem: '',
      color: '',
      caseIncluded: '',
      battery: '',
      repairCost: '',
      amountPaid: '',
      repairStatus: 'pending'
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

  // Calculate repair statistics
  const calculateStats = () => {
    const totalRevenue = repairs.reduce((sum, repair) => sum + (repair.repairCost || 0), 0);
    const totalPaid = repairs.reduce((sum, repair) => sum + (repair.amountPaid || 0), 0);
    const totalBalance = repairs.reduce((sum, repair) => sum + (repair.remainingBalance || 0), 0);
    
    const pending = repairs.filter(r => r.repairStatus === 'pending').length;
    const inProgress = repairs.filter(r => r.repairStatus === 'in_progress').length;
    const completed = repairs.filter(r => r.repairStatus === 'completed').length;
    
    return {
      totalRevenue,
      totalPaid,
      totalBalance,
      pending,
      inProgress,
      completed,
      totalRepairs: repairs.length
    };
  };

  const stats = calculateStats();

  // Close repair modal
  const closeRepairModal = () => {
    setShowRepairModal(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              🔧 Repair Management
            </h1>
            <p className="text-cyan-100 text-lg">
              Track repairs, customers, and product stock
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-4 md:mt-0 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
          >
            <span className="text-xl">+</span> New Repair
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto">
        {successMessage && (
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white p-4 rounded-xl mb-6 shadow-md animate-fadeIn">
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Repairs</p>
                <p className="text-3xl font-bold mt-2">{stats.totalRepairs}</p>
              </div>
              <div className="text-3xl">🔧</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Revenue</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Balance Due</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalBalance)}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">In Progress</p>
                <p className="text-3xl font-bold mt-2">{stats.inProgress}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔍</span> Filter Repairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button 
                onClick={applyFilters}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
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
        {selectedRepairs.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-2xl p-4 mb-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-lg">⚠️</span>
                <div>
                  <p className="font-medium text-red-800">{selectedRepairs.length} repair(s) selected</p>
                  <p className="text-sm text-red-600">These actions will affect all selected repairs</p>
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

        {/* Repairs List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>📋</span> Repairs List ({repairs.length})
              </h2>
              
              {repairs.length > 0 && (
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedRepairs.length === repairs.length && repairs.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading repairs...</p>
            </div>
          ) : repairs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔧</div>
              <p className="text-gray-600 text-lg mb-4">
                No repairs found. Create your first repair!
              </p>
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                + Create First Repair
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
                      <span className="text-gray-700 font-semibold">Product</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Customer</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Problem</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Status</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Cost</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Paid</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Balance</span>
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
                  {repairs.map((repair) => (
                    <tr 
                      key={repair._id}
                      className="hover:bg-blue-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedRepairs.includes(repair._id)}
                          onChange={() => handleSelectRepair(repair._id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white">
                            <span className="text-lg">📱</span>
                          </div>
                          <span className="font-medium text-gray-800">
                            {getProductName(repair.productId)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {getCustomerName(repair.customerId).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-700">
                            {getCustomerName(repair.customerId)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700 text-sm">
                          {repair.problem}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={repair.repairStatus || 'pending'}
                          onChange={(e) => handleStatusUpdate(repair._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-bold border ${
                            repair.repairStatus === 'completed' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : repair.repairStatus === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-gray-800">
                          {formatCurrency(repair.repairCost)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-green-700">
                          {formatCurrency(repair.amountPaid)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-mono font-bold ${(repair.remainingBalance || 0) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {formatCurrency(repair.remainingBalance)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {formatDate(repair.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(repair)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(repair._id)}
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

      {/* Repair Modal */}
      {showRepairModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className=""
              onClick={closeRepairModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {modalTitle}
                </h3>
                <button
                  onClick={closeRepairModal}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                        <div className="mt-2 text-sm text-blue-600">
                          Available Stock: <strong>{getAvailableStock()}</strong>
                          <br />
                          <span className="text-xs text-gray-500">Stock will decrease by 1 when repair is created</span>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

                  {/* Repair Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Problem Description *
                      </label>
                      <input
                        type="text"
                        name="problem"
                        value={formData.problem}
                        onChange={handleInputChange}
                        placeholder="e.g., Screen replacement, Battery issue"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        placeholder="e.g., Black, White, Blue"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Case Included
                      </label>
                      <select
                        name="caseIncluded"
                        value={formData.caseIncluded}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Battery
                      </label>
                      <select
                        name="battery"
                        value={formData.battery}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select</option>
                        <option value="Good">Good</option>
                        <option value="Needs Replacement">Needs Replacement</option>
                        <option value="Dead">Dead</option>
                      </select>
                    </div>
                  </div>

                  {/* Financial */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repair Cost ($) *
                      </label>
                      <input
                        type="number"
                        name="repairCost"
                        value={formData.repairCost}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Paid ($)
                      </label>
                      <input
                        type="number"
                        name="amountPaid"
                        value={formData.amountPaid}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Balance Due ($)
                      </label>
                      <input
                        type="number"
                        name="remainingBalance"
                        value={formData.remainingBalance || 
                          Math.max(0, (parseFloat(formData.repairCost) || 0) - (parseFloat(formData.amountPaid) || 0))}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 font-semibold text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repair Status
                    </label>
                    <select
                      name="repairStatus"
                      value={formData.repairStatus}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    {editingId ? 'Update Repair' : 'Create Repair'}
                  </button>
                  <button
                    type="button"
                    onClick={closeRepairModal}
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

export default Repair;