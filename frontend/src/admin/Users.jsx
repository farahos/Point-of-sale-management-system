import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useUser } from "../hooks/useUser";
import { Navigate } from "react-router-dom";
import { 
  User, 
  Phone, 
  Mail, 
  Shield, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  AlertCircle,
  CheckCircle,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  X,
  Filter,
  Download,
  Upload
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

const Users = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  
  // Redirect non-admin users
  if (user?.role !== "admin") {
    return <Navigate to="/admin-dashboard" />;
  }

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  
  // New user form state
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "user"
  });

  // Edit user form state
  const [editUser, setEditUser] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
    status: "active"
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // API base URL
  const API_URL = "/api/user";

  // Fetch all users with pagination
  const fetchUsers = async (page = 1) => {
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
      
      const res = await axios.get(`${API_URL}`, { 
        params,
        withCredentials: true 
      });
      
      setUsers(res.data.data);
      // Assuming your backend returns pagination data
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (error) {
      setError("Error fetching users");
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page);
  }, [searchTerm, sortField, sortOrder]);

  // Theme-based styling
  const cardClasses = (color = "emerald") => {
    const lightColors = {
      emerald: "bg-gradient-to-br from-emerald-50 to-white border border-emerald-100",
      blue: "bg-gradient-to-br from-blue-50 to-white border border-blue-100",
      purple: "bg-gradient-to-br from-purple-50 to-white border border-purple-100",
      amber: "bg-gradient-to-br from-amber-50 to-white border border-amber-100",
      red: "bg-gradient-to-br from-red-50 to-white border border-red-100",
      gray: "bg-white border border-gray-200"
    };
    
    const darkColors = {
      emerald: "bg-gradient-to-br from-emerald-900/20 to-gray-900 border border-emerald-800/30",
      blue: "bg-gradient-to-br from-blue-900/20 to-gray-900 border border-blue-800/30",
      purple: "bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-800/30",
      amber: "bg-gradient-to-br from-amber-900/20 to-gray-900 border border-amber-800/30",
      red: "bg-gradient-to-br from-red-900/20 to-gray-900 border border-red-800/30",
      gray: "bg-gray-800 border border-gray-700"
    };
    
    return `rounded-xl p-4 shadow-lg transition-all duration-300 ${
      theme === "dark" ? darkColors[color] : lightColors[color]
    }`;
  };

  const inputClasses = () => {
    return theme === "dark"
      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500";
  };

  const buttonClasses = (type = "primary") => {
    const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2";
    
    switch (type) {
      case "primary":
        return theme === "dark"
          ? `${base} bg-green-600 hover:bg-green-700 text-white`
          : `${base} bg-green-600 hover:bg-green-700 text-white`;
      case "secondary":
        return theme === "dark"
          ? `${base} bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700`
          : `${base} bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300`;
      case "danger":
        return theme === "dark"
          ? `${base} bg-red-600 hover:bg-red-700 text-white`
          : `${base} bg-red-600 hover:bg-red-700 text-white`;
      case "warning":
        return theme === "dark"
          ? `${base} bg-yellow-600 hover:bg-yellow-700 text-white`
          : `${base} bg-yellow-600 hover:bg-yellow-700 text-white`;
      default:
        return base;
    }
  };

  // Stats calculation
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    inactive: users.filter(u => u.status === "inactive").length,
    admin: users.filter(u => u.role === "admin").length,
    user: users.filter(u => u.role === "user").length
  };

  // Validate new user form
  const validateForm = (formData, isEdit = false) => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } 

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    return newErrors;
  };

  // Handle input change for forms
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new user
  const addNewUser = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm(newUser);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      toast.error("fields is Required");
      return;
    }

    setNewUserLoading(true);
    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        role: newUser.role,
        status: "active"
      };

      const res = await axios.post(`${API_URL}/registerUser`, userData, { withCredentials: true });
      
      toast.success(res.data.message || "User created successfully!");
      setShowAddUserModal(false);
      resetNewUserForm();
      fetchUsers(); // Refresh the user list
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating user");
    } finally {
      setNewUserLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
    setShowEditUserModal(true);
  };

  // Update user
  const updateUser = async (e) => {
    e.preventDefault();
    
    setEditUserLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/${selectedUser._id}`,
        editUser,
        { withCredentials: true }
      );
      
      toast.success(res.data.message || "User updated successfully!");
      setShowEditUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating user");
    } finally {
      setEditUserLoading(false);
    }
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Delete user
  const deleteUser = async () => {
    if (!selectedUser) return;
    
    setDeleteLoading(true);
    try {
      const res = await axios.delete(`${API_URL}/${selectedUser._id}`, { withCredentials: true });
      toast.success(res.data.message || "User deleted successfully!");
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting user");
    } finally {
      setDeleteLoading(false);
      setSelectedUser(null);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select users to delete");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      try {
        await Promise.all(
          selectedUsers.map(id => 
            axios.delete(`${API_URL}/${id}`, { withCredentials: true })
          )
        );
        toast.success(`${selectedUsers.length} user(s) deleted successfully!`);
        setSelectedUsers([]);
        fetchUsers(pagination.page);
      } catch (error) {
        toast.error("Failed to delete users");
      }
    }
  };

  // Approve (activate) user
  const approveUser = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/approve/${id}`, {}, { withCredentials: true });
      toast.success(res.data.message || "User activated successfully!");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error activating user");
    }
  };

  // Deactivate user
  const deactivateUser = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/inactive/${id}`, {}, { withCredentials: true });
      toast.success(res.data.message || "User deactivated successfully!");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deactivating user");
    }
  };

  // Reset new user form
  const resetNewUserForm = () => {
    setNewUser({
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "user"
    });
    setErrors({});
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchUsers(newPage);
    }
  };

  // Handle user selection
  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  // Sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <span className="opacity-50">↕️</span>;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Render stats card
  const renderStatCard = (title, value, icon, color, description = "") => {
    return (
      <div className={cardClasses(color)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs opacity-70 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${
            theme === "dark" 
              ? "bg-opacity-30 text-opacity-80" 
              : "bg-opacity-20"
          }`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !users.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            theme === "dark" ? "border-green-500" : "border-green-600"
          } mx-auto`}></div>
          <p className={`mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <UsersIcon size={28} />
              User Management
            </h1>
            <p className="opacity-80">
              Manage system users and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className={buttonClasses("primary")}
          >
            <Plus size={20} />
            Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 md:mb-8">
        {renderStatCard(
          "Total Users", 
          stats.total, 
          <UsersIcon size={24} />,
          "emerald"
        )}
        {renderStatCard(
          "Active", 
          stats.active, 
          <CheckCircle size={24} />,
          "blue"
        )}
        {renderStatCard(
          "Inactive", 
          stats.inactive, 
          <EyeOff size={24} />,
          "amber"
        )}
        {renderStatCard(
          "Admins", 
          stats.admin, 
          <Shield size={24} />,
          "purple"
        )}
        {renderStatCard(
          "Regular Users", 
          stats.user, 
          <User size={24} />,
          "gray"
        )}
      </div>

      {/* Search and Actions */}
      <div className={cardClasses("gray") + " mb-6"}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="opacity-50" />
              </div>
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                className={`w-full pl-12 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
              >
                <option value="username">Sort by Name</option>
                <option value="createdAt">Sort by Date</option>
                <option value="role">Sort by Role</option>
                <option value="status">Sort by Status</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded ${
                    viewMode === "table" 
                      ? "bg-green-600 text-white" 
                      : theme === "dark" 
                        ? "bg-gray-800" 
                        : "bg-gray-100"
                  }`}
                  title="Table View"
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid" 
                      ? "bg-green-600 text-white" 
                      : theme === "dark" 
                        ? "bg-gray-800" 
                        : "bg-gray-100"
                  }`}
                  title="Grid View"
                >
                  Grid
                </button>
              </div>
            </div>
          </div>
          
          {selectedUsers.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className={buttonClasses("danger")}
            >
              <Trash2 size={20} />
              Delete Selected ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {/* Users Content */}
      <div className={cardClasses("gray")}>
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Users List ({users.length})
            </h2>
            
            {users.length > 0 && (
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedUsers.length === users.length && users.length > 0}
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

        {error ? (
          <div className={`p-8 text-center ${
            theme === "dark" ? "text-red-400" : "text-red-600"
          }`}>
            <AlertCircle size={48} className="mx-auto mb-4" />
            <div className="mb-4">{error}</div>
            <button
              onClick={() => fetchUsers(pagination.page)}
              className={buttonClasses("primary")}
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4">
              <UsersIcon size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2 opacity-80">
              No users found
            </h3>
            <p className="opacity-70 mb-6">
              {searchTerm ? "Try a different search term" : "Add your first user to get started"}
            </p>
            <button
              onClick={() => setShowAddUserModal(true)}
              className={buttonClasses("primary")}
            >
              <Plus size={20} />
              Add User
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
            {users.map((user) => (
              <div 
                key={user._id}
                className={`rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  theme === "dark" 
                    ? "bg-gray-800 border-gray-700" 
                    : "bg-white border-gray-200"
                }`}
              >
                {/* User Header */}
                <div className={`p-4 border-b ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="w-5 h-5 rounded focus:ring-green-500"
                      />
                      <div>
                        <span className="font-bold text-lg truncate">
                          {user.username}
                        </span>
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ml-2 ${
                          user.role === "admin"
                            ? theme === "dark"
                              ? "bg-purple-900/30 text-purple-300"
                              : "bg-purple-100 text-purple-700"
                            : theme === "dark"
                              ? "bg-blue-900/30 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                        }`}>
                          {user.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className={`p-1.5 rounded ${
                          theme === "dark" 
                            ? "hover:bg-gray-700" 
                            : "hover:bg-gray-100"
                        }`}
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className={`p-1.5 rounded ${
                          theme === "dark" 
                            ? "hover:bg-red-900/30 text-red-400" 
                            : "hover:bg-red-100 text-red-600"
                        }`}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="opacity-60" />
                        <a 
                          href={`mailto:${user.email}`}
                          className="text-green-500 hover:underline truncate"
                        >
                          {user.email}
                        </a>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="opacity-60" />
                        <span className="font-medium">{user.phone}</span>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.status === "active"
                            ? theme === "dark"
                              ? "bg-green-900/30 text-green-300"
                              : "bg-green-100 text-green-800"
                            : theme === "dark"
                              ? "bg-yellow-900/30 text-yellow-300"
                              : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {user.status}
                        </span>
                        <div className="text-xs opacity-70 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {user.status === "inactive" ? (
                          <button
                            onClick={() => approveUser(user._id)}
                            className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 ${
                              theme === "dark"
                                ? "bg-green-900/30 hover:bg-green-800 text-green-300"
                                : "bg-green-100 hover:bg-green-200 text-green-700"
                            }`}
                          >
                            <CheckCircle size={14} />
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => deactivateUser(user._id)}
                            className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 ${
                              theme === "dark"
                                ? "bg-yellow-900/30 hover:bg-yellow-800 text-yellow-300"
                                : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                            }`}
                          >
                            <EyeOff size={14} />
                            Deactivate
                          </button>
                        )}
                      </div>
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
                <thead className={theme === "dark" ? "bg-gray-800" : "bg-gray-50"}>
                  <tr>
                    <th className="py-3 px-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 rounded focus:ring-green-500"
                      />
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort("username")}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Username
                        {getSortIcon("username")}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort("email")}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Email
                        {getSortIcon("email")}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort("phone")}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Phone
                        {getSortIcon("phone")}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort("role")}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Role
                        {getSortIcon("role")}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort("status")}
                        className="font-semibold flex items-center gap-1 hover:opacity-80"
                      >
                        Status
                        {getSortIcon("status")}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">Created</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr 
                      key={user._id}
                      className={theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-50"}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="w-5 h-5 rounded focus:ring-green-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium flex items-center gap-2">
                          <User size={16} className="opacity-60" />
                          {user.username}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="opacity-60" />
                          <a 
                            href={`mailto:${user.email}`}
                            className="text-green-500 hover:underline truncate max-w-xs"
                          >
                            {user.email}
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="opacity-60" />
                          <span className="font-medium">{user.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? theme === "dark"
                              ? "bg-purple-900/30 text-purple-300"
                              : "bg-purple-100 text-purple-700"
                            : theme === "dark"
                              ? "bg-blue-900/30 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.status === "active"
                            ? theme === "dark"
                              ? "bg-green-900/30 text-green-300"
                              : "bg-green-100 text-green-800"
                            : theme === "dark"
                              ? "bg-yellow-900/30 text-yellow-300"
                              : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 opacity-80">
                          <Calendar size={14} />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === "dark" 
                                ? "bg-gray-700 hover:bg-gray-600" 
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.status === "inactive" ? (
                            <button
                              onClick={() => approveUser(user._id)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === "dark" 
                                  ? "bg-green-900/30 hover:bg-green-800 text-green-300" 
                                  : "bg-green-100 hover:bg-green-200 text-green-700"
                              }`}
                              title="Activate"
                            >
                              <CheckCircle size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => deactivateUser(user._id)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === "dark" 
                                  ? "bg-yellow-900/30 hover:bg-yellow-800 text-yellow-300" 
                                  : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                              }`}
                              title="Deactivate"
                            >
                              <EyeOff size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === "dark" 
                                ? "bg-red-900/30 hover:bg-red-900/50 text-red-400" 
                                : "bg-red-100 hover:bg-red-200 text-red-600"
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
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm opacity-80">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        pagination.page === 1
                          ? "opacity-50 cursor-not-allowed"
                          : theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
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
                                ? "bg-green-600 text-white"
                                : theme === "dark"
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-gray-100"
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
                          ? "opacity-50 cursor-not-allowed"
                          : theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
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

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-2xl shadow-2xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            {/* Two Column Layout */}
            <div className="flex flex-col md:flex-row">
              {/* Left Column - Green (Info) */}
              <div className="md:w-1/3 bg-gradient-to-b from-green-600 to-green-700 p-8 text-white">
                <div className="h-full flex flex-col justify-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                      <User size={32} />
                    </div>
                    <h3 className="text-2xl font-bold">Create New User</h3>
                    <p className="text-green-100 mt-2 text-sm">Register a new system user</p>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={12} />
                      </div>
                      <p className="text-sm text-green-100">User will be automatically activated</p>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={12} />
                      </div>
                      <p className="text-sm text-green-100">Select user role (User/Admin)</p>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={12} />
                      </div>
                      <p className="text-sm text-green-100">New user will receive email and SMS notifications</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="md:w-2/3 p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-bold">Create User</h3>
                    <p className="opacity-70 mt-1">Add a new user to the system</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddUserModal(false);
                      resetNewUserForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition duration-200"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={addNewUser} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Username */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        <span className="text-red-500">*</span> Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={20} className="opacity-60" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          value={newUser.username}
                          onChange={handleNewUserChange}
                          className={`w-full pl-10 pr-3 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 ${
                            errors.username 
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                              : theme === "dark"
                                ? "border-gray-700 focus:ring-green-500 focus:border-green-500"
                                : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                          } ${inputClasses()}`}
                          placeholder="Enter username"
                        />
                      </div>
                      {errors.username && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={16} />
                          {errors.username}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        <span className="text-red-500">*</span> Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={20} className="opacity-60" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={newUser.email}
                          onChange={handleNewUserChange}
                          className={`w-full pl-10 pr-3 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 ${
                            errors.email 
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                              : theme === "dark"
                                ? "border-gray-700 focus:ring-green-500 focus:border-green-500"
                                : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                          } ${inputClasses()}`}
                          placeholder="example@email.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={16} />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        <span className="text-red-500">*</span> Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone size={20} className="opacity-60" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={newUser.phone}
                          onChange={handleNewUserChange}
                          className={`w-full pl-10 pr-3 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 ${
                            errors.phone 
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                              : theme === "dark"
                                ? "border-gray-700 focus:ring-green-500 focus:border-green-500"
                                : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                          } ${inputClasses()}`}
                          placeholder="+252 619 964 951"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={16} />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        <span className="text-red-500">*</span> Role
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Shield size={20} className="opacity-60" />
                        </div>
                        <select
                          name="role"
                          value={newUser.role}
                          onChange={handleNewUserChange}
                          className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 ${
                            theme === "dark"
                              ? "border-gray-700 focus:ring-green-500 focus:border-green-500"
                              : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                          } ${inputClasses()}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        <span className="text-red-500">*</span> Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={20} className="opacity-60" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          value={newUser.password}
                          onChange={handleNewUserChange}
                          className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 ${
                            errors.password 
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                              : theme === "dark"
                                ? "border-gray-700 focus:ring-green-500 focus:border-green-500"
                                : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                          } ${inputClasses()}`}
                          placeholder="••••••••"
                        />
                        {newUser.password && !errors.password && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <CheckCircle size={20} className="text-green-500" />
                          </div>
                        )}
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={16} />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        <span className="text-red-500">*</span> Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={20} className="opacity-60" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={newUser.confirmPassword}
                          onChange={handleNewUserChange}
                          className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 ${
                            errors.confirmPassword 
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                              : theme === "dark"
                                ? "border-gray-700 focus:ring-green-500 focus:border-green-500"
                                : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                          } ${inputClasses()}`}
                          placeholder="••••••••"
                        />
                        {newUser.confirmPassword && !errors.confirmPassword && newUser.password === newUser.confirmPassword && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <CheckCircle size={20} className="text-green-500" />
                          </div>
                        )}
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={16} />
                          {errors.confirmPassword}
                        </p>
                      )}
                      {newUser.confirmPassword && newUser.password === newUser.confirmPassword && !errors.confirmPassword && (
                        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle size={16} />
                          Passwords match
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="adminTerms"
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-1"
                      required
                    />
                    <label htmlFor="adminTerms" className="text-sm opacity-80">
                      I confirm that I have the authority to create this user and agree to comply with all relevant policies.
                    </label>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddUserModal(false);
                        resetNewUserForm();
                      }}
                      className={buttonClasses("secondary") + " flex-1"}
                    >
                      <X size={20} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={newUserLoading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      {newUserLoading ? (
                        <>
                          <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
                            theme === "dark" ? "border-white" : "border-white"
                          }`}></div>
                          Creating User
                        </>
                      ) : (
                        <>
                          <User size={20} />
                          Create User
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-2xl shadow-2xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Edit User
                </h3>
                <p className="opacity-70 mt-1">Update user information</p>
              </div>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={updateUser} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={editUser.username}
                  onChange={handleEditUserChange}
                  required
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={editUser.email}
                  onChange={handleEditUserChange}
                  required
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                  placeholder="Enter email"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editUser.phone}
                  onChange={handleEditUserChange}
                  required
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Role
                  </label>
                  <select
                    name="role"
                    value={editUser.role}
                    onChange={handleEditUserChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={editUser.status}
                    onChange={handleEditUserChange}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${inputClasses()}`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className={buttonClasses("secondary") + " flex-1"}
                  disabled={editUserLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className={buttonClasses("primary") + " flex-1"}
                >
                  {editUserLoading ? (
                    <span className="flex items-center justify-center">
                      <span className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                        theme === "dark" ? "border-white" : "border-white"
                      } mr-2`}></span>
                      Updating...
                    </span>
                  ) : (
                    "Update User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-2xl shadow-2xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className={`text-lg font-medium ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Delete User
              </h3>
              <div className="mt-2">
                <p className="text-sm opacity-70">
                  Are you sure you want to delete user <span className="font-semibold">{selectedUser.username}</span>?
                </p>
                <p className="text-sm text-red-500 mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className={buttonClasses("secondary") + " flex-1"}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteUser}
                disabled={deleteLoading}
                className={buttonClasses("danger") + " flex-1"}
              >
                {deleteLoading ? (
                  <span className="flex items-center justify-center">
                    <span className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                      theme === "dark" ? "border-white" : "border-white"
                    } mr-2`}></span>
                    Deleting...
                  </span>
                ) : (
                  "Delete User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;