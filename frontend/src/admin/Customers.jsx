import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download,
  Upload,
  Filter,
  Tag,
  X
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { toast } from 'react-hot-toast';

const Customer = () => {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentCustomer, setCurrentCustomer] = useState({
    _id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [stats, setStats] = useState({
    total: 0,
    withEmail: 0,
    withAddress: 0,
    active: 0
  });

  // Fetch customers
  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        sort: sortField,
        order: sortOrder
      };
      
      const response = await axios.get('https://backendapp-qtb2.onrender.com/api/customers', { params });
      
      if (response.data.success) {
        setCustomers(response.data.data);
        setPagination(response.data.pagination);
        
        // Calculate stats
        const customersData = response.data.data;
        setStats({
          total: response.data.pagination.total,
          withEmail: customersData.filter(c => c.email).length,
          withAddress: customersData.filter(c => c.address).length,
          active: customersData.filter(c => c.isActive !== false).length
        });
      }
    } catch (err) {
      setError('Failed to load customers. Please try again.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(pagination.page);
  }, [searchTerm, sortField, sortOrder]);

  // Theme-based styling
  const cardClasses = (color = 'emerald') => {
    const lightColors = {
      emerald: 'bg-gradient-to-br from-emerald-50 to-white border border-emerald-100',
      blue: 'bg-gradient-to-br from-blue-50 to-white border border-blue-100',
      purple: 'bg-gradient-to-br from-purple-50 to-white border border-purple-100',
      amber: 'bg-gradient-to-br from-amber-50 to-white border border-amber-100',
      gray: 'bg-white border border-gray-200'
    };
    
    const darkColors = {
      emerald: 'bg-gradient-to-br from-emerald-900/20 to-gray-900 border border-emerald-800/30',
      blue: 'bg-gradient-to-br from-blue-900/20 to-gray-900 border border-blue-800/30',
      purple: 'bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-800/30',
      amber: 'bg-gradient-to-br from-amber-900/20 to-gray-900 border border-amber-800/30',
      gray: 'bg-gray-800 border border-gray-700'
    };
    
    return `rounded-xl p-4 shadow-lg transition-all duration-300 ${
      theme === 'dark' ? darkColors[color] : lightColors[color]
    }`;
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

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchCustomers(newPage);
    }
  };

  // Open modal for adding new customer
  const handleAddCustomer = () => {
    setModalMode('add');
    setCurrentCustomer({
      _id: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      tags: []
    });
    setNewTag('');
    setShowModal(true);
  };

  // Open modal for editing customer
  const handleEditCustomer = (customer) => {
    setModalMode('edit');
    setCurrentCustomer({
      _id: customer._id,
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
      tags: customer.tags || []
    });
    setNewTag('');
    setShowModal(true);
  };

  // Handle delete customer
  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await axios.delete(`https://backendapp-qtb2.onrender.com/api/customers/${id}`);
        
        if (response.data.success) {
          toast.success('Customer deleted successfully!');
          fetchCustomers(pagination.page);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete customer');
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select customers to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
      try {
        await axios.delete('https://backendapp-qtb2.onrender.com/api/customers/bulk', { data: { ids: selectedCustomers } });
        toast.success(`${selectedCustomers.length} customer(s) deleted successfully!`);
        setSelectedCustomers([]);
        fetchCustomers(pagination.page);
      } catch (err) {
        toast.error('Failed to delete customers');
      }
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle tag input
  const handleTagInput = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!currentCustomer.tags.includes(newTag.trim())) {
        setCurrentCustomer(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
        }));
      }
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setCurrentCustomer(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const customerData = {
        name: currentCustomer.name.trim(),
        phone: currentCustomer.phone.trim(),
        email: currentCustomer.email?.trim() || '',
        address: currentCustomer.address?.trim() || '',
        notes: currentCustomer.notes?.trim() || '',
        tags: currentCustomer.tags
      };

      if (modalMode === 'add') {
        const response = await axios.post('https://backendapp-qtb2.onrender.com/api/customers', customerData);
        
        if (response.data.success) {
          toast.success('Customer added successfully!');
          setShowModal(false);
          fetchCustomers(1);
        }
      } else {
        const response = await axios.put(`https://backendapp-qtb2.onrender.com/api/customers/${currentCustomer._id}`, customerData);
        
        if (response.data.success) {
          toast.success('Customer updated successfully!');
          setShowModal(false);
          fetchCustomers(pagination.page);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
        (modalMode === 'add' ? 'Failed to add customer' : 'Failed to update customer');
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer selection
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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <span className="opacity-50">↕️</span>;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Render stats card
  const renderStatCard = (title, value, icon, color) => {
    return (
      <div className={cardClasses(color)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${
            theme === 'dark' 
              ? 'bg-opacity-30 text-opacity-80' 
              : 'bg-opacity-20'
          }`}>
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <Users size={28} />
              Customer Management
            </h1>
            <p className="opacity-80">
              Manage your customer database with ease
            </p>
          </div>
          <button
            onClick={handleAddCustomer}
            className={buttonClasses('primary')}
          >
            <Plus size={20} />
            Add New Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
        {renderStatCard(
          "Total Customers", 
          stats.total, 
          <Users size={24} />,
          "emerald"
        )}
        {renderStatCard(
          "With Email", 
          stats.withEmail, 
          <Mail size={24} />,
          "blue"
        )}
        {renderStatCard(
          "With Address", 
          stats.withAddress, 
          <MapPin size={24} />,
          "purple"
        )}
        {renderStatCard(
          "Active", 
          stats.active, 
          <CheckCircle size={24} />,
          "amber"
        )}
      </div>

      {/* Search and Actions */}
      <div className={cardClasses('gray') + ' mb-6'}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="opacity-50" />
              </div>
              <input
                type="text"
                placeholder="Search customers by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                className={`w-full pl-12 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              >
                <option value="name">Sort by Name</option>
                <option value="createdAt">Sort by Date</option>
                <option value="phone">Sort by Phone</option>
              </select>

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
          
          {selectedCustomers.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className={buttonClasses('danger')}
            >
              <Trash2 size={20} />
              Delete Selected ({selectedCustomers.length})
            </button>
          )}
        </div>
      </div>

      {/* Customers Content */}
      <div className={cardClasses('gray')}>
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Customers List ({customers.length})
            </h2>
            
            {customers.length > 0 && (
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded focus:ring-green-500"
                  />
                  <label htmlFor="selectAll" className="text-sm">
                    Select All
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
              theme === 'dark' ? 'border-green-500' : 'border-green-600'
            }`}></div>
          </div>
        ) : error ? (
          <div className={`p-8 text-center ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}>
            <AlertCircle size={48} className="mx-auto mb-4" />
            <div className="mb-4">{error}</div>
            <button
              onClick={() => fetchCustomers(pagination.page)}
              className={buttonClasses('primary')}
            >
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4">
              <Users size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2 opacity-80">
              No customers found
            </h3>
            <p className="opacity-70 mb-6">
              {searchTerm ? 'Try a different search term' : 'Add your first customer to get started'}
            </p>
            <button
              onClick={handleAddCustomer}
              className={buttonClasses('primary')}
            >
              <Plus size={20} />
              Add Customer
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
            {customers.map((customer) => (
              <div 
                key={customer._id}
                className={`rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Customer Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer._id)}
                        onChange={() => handleSelectCustomer(customer._id)}
                        className="w-5 h-5 rounded focus:ring-green-500"
                      />
                      <span className="font-bold text-lg truncate">
                        {customer.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className={`p-1 rounded ${
                          theme === 'dark' 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer._id)}
                        className={`p-1 rounded ${
                          theme === 'dark' 
                            ? 'hover:bg-red-900/30 text-red-400' 
                            : 'hover:bg-red-100 text-red-600'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="opacity-60" />
                        <span className="font-medium">{customer.phone}</span>
                      </div>
                      
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="opacity-60" />
                          <a 
                            href={`mailto:${customer.email}`}
                            className="text-green-500 hover:underline truncate"
                          >
                            {customer.email}
                          </a>
                        </div>
                      )}
                      
                      {customer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="opacity-60 mt-0.5" />
                          <span className="text-sm opacity-80 line-clamp-2">
                            {customer.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {customer.notes && (
                      <div>
                        <p className="text-sm font-medium opacity-70 mb-1">Notes</p>
                        <p className="text-sm opacity-80 line-clamp-3">
                          {customer.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm opacity-70">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(customer.createdAt)}
                      </div>
                      {customer.tags && customer.tags.length > 0 && (
                        <span className="px-2 py-1 rounded-full bg-opacity-20 text-xs">
                          {customer.tags.length} tags
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th className="py-3 px-4 text-left">
                      <span className="font-semibold"></span>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort('name')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Name
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort('phone')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Phone
                        {getSortIcon('phone')}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort('email')}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Email
                        {getSortIcon('email')}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">Address</th>
                    <th className="py-3 px-4 text-left">Created</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((customer, index) => (
                    <tr 
                      key={customer._id}
                      className={theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleSelectCustomer(customer._id)}
                          className="w-5 h-5 rounded focus:ring-green-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{customer.name}</div>
                        {customer.notes && (
                          <div className="text-sm opacity-70 truncate max-w-xs">
                            {customer.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="opacity-60" />
                          <span className="font-medium">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {customer.email ? (
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="opacity-60" />
                            <a 
                              href={`mailto:${customer.email}`}
                              className="text-green-500 hover:underline"
                            >
                              {customer.email}
                            </a>
                          </div>
                        ) : (
                          <span className="opacity-50 italic">No email</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {customer.address ? (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="opacity-60 flex-shrink-0" />
                            <span className="opacity-80 truncate max-w-xs">
                              {customer.address}
                            </span>
                          </div>
                        ) : (
                          <span className="opacity-50 italic">No address</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 opacity-80">
                          <Calendar size={14} />
                          {formatDate(customer.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCustomer(customer)}
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
                            onClick={() => handleDeleteCustomer(customer._id)}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === 'dark' 
                                ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' 
                                : 'bg-red-100 hover:bg-red-200 text-red-600'
                            }`}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className={`border-t px-4 py-3 ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm opacity-80">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} customers
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        pagination.page === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'
                      }`}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex gap-1">
                      {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg ${
                              pagination.page === pageNum
                                ? 'bg-green-600 text-white'
                                : theme === 'dark'
                                  ? 'hover:bg-gray-700'
                                  : 'hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`p-2 rounded-lg transition-colors ${
                        pagination.page === pagination.pages
                          ? 'opacity-50 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'
                      }`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Modal */}
      {showModal && (
        <div className="fixed bg-opacity-50 inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div 
              className="fixed   transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            <div className={`inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-xl shadow-2xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {modalMode === 'add' ? 'Add New Customer' : 'Edit Customer'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentCustomer.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={currentCustomer.phone}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={currentCustomer.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={currentCustomer.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                    placeholder="Enter address"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={currentCustomer.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                    placeholder="Any additional notes..."
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentCustomer.tags && currentCustomer.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          theme === 'dark'
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-xs hover:opacity-70"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleTagInput}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                    placeholder="Type tag and press Enter"
                  />
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={buttonClasses('secondary') + ' flex-1'}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={buttonClasses('primary') + ' flex-1'}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <span className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                          theme === 'dark' ? 'border-white' : 'border-white'
                        } mr-2`}></span>
                        {modalMode === 'add' ? 'Adding...' : 'Updating...'}
                      </span>
                    ) : (
                      modalMode === 'add' ? 'Add Customer' : 'Update Customer'
                    )}
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

export default Customer;