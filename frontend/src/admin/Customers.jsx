import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add New Customer');
  
  const API_URL = '/api/customers';

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}?search=${searchTerm}`);
      setCustomers(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Name and phone are required');
      return;
    }

    try {
      if (editingId) {
        // Update existing customer
        await axios.put(`${API_URL}/${editingId}`, formData);
        setSuccessMessage('Customer updated successfully!');
      } else {
        // Create new customer
        await axios.post(API_URL, formData);
        setSuccessMessage('Customer created successfully!');
      }
      
      // Reset form and refresh list
      resetForm();
      fetchCustomers();
      setShowModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  // Open Add Customer Modal
  const openAddModal = () => {
    resetForm();
    setModalTitle('Add New Customer');
    setShowModal(true);
  };

  // Edit customer
  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone
    });
    setEditingId(customer._id);
    setModalTitle('Edit Customer');
    setShowModal(true);
  };

  // Delete customer
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccessMessage('Customer deleted successfully!');
        fetchCustomers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete customer');
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) {
      setError('Please select customers to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
      try {
        await axios.delete(API_URL, { data: { ids: selectedCustomers } });
        setSuccessMessage(`${selectedCustomers.length} customer(s) deleted successfully!`);
        setSelectedCustomers([]);
        fetchCustomers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete customers');
      }
    }
  };

  // Handle customer selection for bulk operations
  const handleSelectCustomer = (id) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(customerId => customerId !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(customer => customer._id));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', phone: '' });
    setEditingId(null);
    setError('');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-500 mb-2">
               Customers
            </h1>
            <p className="text-emerald-100 text-lg">
              
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-4 md:mt-0 bg-green-500 text-white hover:bg-emerald-50 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Add New Customer
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

        {/* Search and Bulk Actions */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            {selectedCustomers.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
              >
                <span></span>
                Delete Selected ({selectedCustomers.length})
              </button>
            )}
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>📋</span> Customers List ({customers.length})
              </h2>
              
              {customers.length > 0 && (
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
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
              <p className="mt-4 text-gray-600">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg mb-4">
                No customers found. Add your first customer!
              </p>
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                + Add First Customer
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
                      <span className="text-gray-700 font-semibold">Name</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Phone</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Created Date</span>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="text-gray-700 font-semibold">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr 
                      key={customer._id}
                      className="hover:bg-emerald-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleSelectCustomer(customer._id)}
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span></span>
                          <span className="font-medium">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200"
                            title="Edit"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                            title="Delete"
                          >
                            delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Customer Statistics */}
   
        </div>

        {/* Footer */}
       
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className=""
              onClick={closeModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {modalTitle}
                </h3>
                <button
                  onClick={closeModal}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    {editingId ? 'Update Customer' : 'Add Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
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

export default Customer;