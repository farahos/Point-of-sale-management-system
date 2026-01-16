import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  Search, Users, DollarSign, CreditCard, 
  Plus, X, Eye,
  User, Phone, Calendar, FileText,
  RefreshCw, ChevronDown,
  TrendingUp, Wallet, Receipt,
  ChevronLeft
} from "lucide-react";

const debt = () => {
  
  const [view, setView] = useState("list");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("debt");
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch all customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/customers`);
      
      // Check if response has data array
      let customersData = res.data;
      
      if (customersData && Array.isArray(customersData)) {
        // API returns array directly
        setCustomers(customersData);
        setFilteredCustomers(customersData);
      } else if (customersData && customersData.data && Array.isArray(customersData.data)) {
        // API returns { data: [...] }
        setCustomers(customersData.data);
        setFilteredCustomers(customersData.data);
      } else {
        console.error("Unexpected API response format:", customersData);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      console.error("Error details:", err.response?.data || err.message);
      toast.error("Khalad ayaa dhacay marka la helayay customers");
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single customer details
  const fetchCustomerDetails = async (id) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) {
      console.error("Error fetching customer details:", err);
      toast.error("Khalad ayaa dhacay marka la helayay macmiilka");
    } finally {
      setIsLoading(false);
    }
  };

  // Add transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !amount || !description) {
      toast.error("Fadlan buuxi dhammaan goobaha!");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`/api/debts/${selectedCustomer._id}/transactions`, {
        description,
        amount: parseFloat(amount),
        type: transactionType
      });
      
      toast.success(transactionType === "debt" ? "debt waa lagu daray!" : "Bixin waa lagu daray!");
      setDescription("");
      setAmount("");
      setShowTransactionForm(false);
      
      // Refresh data
      if (view === "details") {
        fetchCustomerDetails(selectedCustomer._id);
      }
      fetchCustomers();
    } catch (err) {
      console.error("Error adding transaction:", err);
      toast.error("Khalad ayaa dhacay marka la darayay waxqabad");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("so-SO", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const formatDateTime = (date) =>
    new Date(date).toLocaleString("so-SO", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const formatMoney = (num) =>
    new Intl.NumberFormat("so-SO", {
      style: "currency",
      currency: "USD",
    }).format(num || 0);

  const calculateTotals = (customer) => {
    if (!customer?.transactions || customer.transactions.length === 0) {
      return { totaldebt: 0, totalBixin: 0, balance: 0 };
    }

    let totaldebt = 0;
    let totalBixin = 0;

    customer.transactions.forEach((t) => {
      if (t.type === "debt") totaldebt += t.amount;
      if (t.type === "payment") totalBixin += t.amount;
    });

    return {
      totaldebt,
      totalBixin,
      balance: totaldebt - totalBixin,
    };
  };

  // Calculate overall statistics
  const calculateStats = () => {
    let totalDebt = 0;
    let totalPaid = 0;
    let totalCustomers = customers.length;
    let customersWithDebt = 0;

    customers.forEach(c => {
      const totals = calculateTotals(c);
      totalDebt += totals.balance > 0 ? totals.balance : 0;
      totalPaid += totals.totalBixin;
      if (totals.balance > 0) customersWithDebt++;
    });

    return {
      totalDebt,
      totalPaid,
      totalCustomers,
      customersWithDebt,
      collectionRate: totalDebt > 0 ? (totalPaid / (totalDebt + totalPaid)) * 100 : 0
    };
  };

  // Search and filter
  useEffect(() => {
    let filtered = customers;

    // Apply search
    if (searchText) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
        (c.phone && c.phone.includes(searchText))
      );
    }

    // Apply filter
    if (activeFilter === "with-debt") {
      filtered = filtered.filter(c => calculateTotals(c).balance > 0);
    } else if (activeFilter === "no-debt") {
      filtered = filtered.filter(c => calculateTotals(c).balance <= 0);
    }

    setFilteredCustomers(filtered);
  }, [searchText, customers, activeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <span className="text-emerald-700">Maamulka</span> debtta
            </h1>
            <p className="text-gray-600 mt-2">Nidaam hal page ah oo debt lagu maamulo</p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            {view === "details" && selectedCustomer && (
              <button
                onClick={() => {
                  setView("list");
                  setSelectedCustomer(null);
                }}
                className="flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 font-medium py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <ChevronLeft size={20} />
                Ku noqo List
              </button>
            )}
            
            {/* New Transaction Button */}
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setTransactionType("debt");
                setShowTransactionForm(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus size={20} />
              debt/Bixin Cusub
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Wadarta debtta</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatMoney(stats.totalDebt)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <CreditCard className="text-emerald-600" size={28} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-emerald-600 font-medium">
                <TrendingUp size={14} className="inline mr-1" />
                {stats.customersWithDebt} macmiil debt ku ledahay
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Wadarta Bixinta</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatMoney(stats.totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-xl">
                <DollarSign className="text-green-600" size={28} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-green-600 font-medium">
                <Wallet size={14} className="inline mr-1" />
                {stats.collectionRate.toFixed(1)}% collection rate
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Macaamiisha</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalCustomers}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <Users className="text-blue-600" size={28} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-blue-600 font-medium">
                <User size={14} className="inline mr-1" />
                Macaamiisha guud
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
              CUSTOMER LIST VIEW
           ===================================================== */}
        {view === "list" && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Raadi macmiilka magaca ama taleefanka..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Dhammaan Macaamiisha</option>
                    <option value="with-debt">debt Leh</option>
                    <option value="no-debt">debt Aan Laheyn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Liiska Macaamiisha</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {filteredCustomers.length} macmiil{filteredCustomers.length !== 1 ? 'ood' : ''} ayaa la helay
                    </p>
                  </div>
                  <button
                    onClick={fetchCustomers}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Cusboonaysii
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ma jiro macmiil</h3>
                  <p className="text-gray-600 mb-6">Customer-ka ugu horeeya waxaad ku dari kartaa Customer App-ga</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            Magaca
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Phone size={16} />
                            Taleefan
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            Taariikh
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} />
                            Haraaga
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => {
                        const totals = calculateTotals(customer);
                        const customerName = customer.name || customer.customerName || "No Name";
                        return (
                          <tr key={customer._id} className="hover:bg-emerald-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                                  <User size={20} className="text-emerald-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {customerName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {customer.transactions?.length || 0} waxqabad
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 flex items-center gap-2">
                                <Phone size={14} className="text-gray-400" />
                                {customer.phone || '--'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(customer.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  totals.balance > 0
                                    ? 'bg-red-100 text-red-800'
                                    : totals.balance < 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {formatMoney(totals.balance)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    await fetchCustomerDetails(customer._id);
                                    setView("details");
                                  }}
                                  className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-md transition-all duration-200"
                                  title="Arag faahfaahin"
                                >
                                  <Eye size={16} />
                                  View
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(customer);
                                    setTransactionType("debt");
                                    setShowTransactionForm(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-md transition-all duration-200"
                                  title="Ku dar debt"
                                >
                                  <Plus size={16} />
                                  debt
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(customer);
                                    setTransactionType("payment");
                                    setShowTransactionForm(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-4 rounded-md transition-all duration-200"
                                  title="Ku dar bixin"
                                >
                                  <Minus size={16} />
                                  Bixin
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
          </>
        )}

        {/* =====================================================
              CUSTOMER DETAILS VIEW
           ===================================================== */}
        {view === "details" && selectedCustomer && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Customer Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedCustomer.name || selectedCustomer.customerName}
                  </h2>
                  <p className="text-emerald-100 mt-1 flex items-center gap-2">
                    <Phone size={16} />
                    {selectedCustomer.phone || 'Ma jiro taleefan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(() => {
                  const t = calculateTotals(selectedCustomer);
                  return (
                    <>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-red-800">Wadarta debtta</h3>
                          <CreditCard className="text-red-600" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-red-900">
                          {formatMoney(t.totaldebt)}
                        </p>
                        <p className="text-sm text-red-600 mt-2">
                          {selectedCustomer.transactions?.filter(tr => tr.type === "debt").length || 0} debt
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-green-800">Wadarta Bixinta</h3>
                          <DollarSign className="text-green-600" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-green-900">
                          {formatMoney(t.totalBixin)}
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          {selectedCustomer.transactions?.filter(tr => tr.type === "payment").length || 0} bixin
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border-l-4 border-emerald-500">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-emerald-800">Haraaga Hadda</h3>
                          <Wallet className="text-emerald-600" size={24} />
                        </div>
                        <p className={`text-3xl font-bold ${t.balance > 0 ? 'text-red-900' : t.balance < 0 ? 'text-green-900' : 'text-gray-900'}`}>
                          {formatMoney(t.balance)}
                        </p>
                        <p className="text-sm text-emerald-600 mt-2">
                          {selectedCustomer.transactions?.length || 0} waxqabad guud
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={() => {
                    setTransactionType("debt");
                    setShowTransactionForm(true);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus size={20} />
                  debt Ku Qor
                </button>

                <button
                  onClick={() => {
                    setTransactionType("payment");
                    setShowTransactionForm(true);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Minus size={20} />
                  debt Ka Jar
                </button>
              </div>

              {/* Transaction History */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Taariikhda Deymaha
                  </h3>
                  <span className="text-sm text-gray-600">
                    {selectedCustomer.transactions?.length || 0} waxqabad
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {selectedCustomer.transactions?.length > 0 ? (
                    [...selectedCustomer.transactions]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((transaction, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <Calendar size={14} />
                                {formatDateTime(transaction.date)}
                              </p>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${transaction.type === "debt" ? 'bg-red-50' : 'bg-green-50'}`}>
                              <span className={`font-bold text-lg ${transaction.type === "debt" ? 'text-red-600' : 'text-green-600'}`}>
                                {transaction.type === "debt" ? '+' : '-'}
                                {formatMoney(transaction.amount)}
                              </span>
                              <span className={`text-xs font-medium ${transaction.type === "debt" ? 'text-red-700' : 'text-green-700'}`}>
                                {transaction.type === "debt" ? 'debt' : 'BIXIN'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <Receipt size={24} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Ma jiro waxqabad</h4>
                      <p className="text-gray-600">Ku dar waxqabad ku bilow debt ama bixin</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
            TRANSACTION MODAL WITH CUSTOMER DROPDOWN
         ===================================================== */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {transactionType === "debt" ? "Ku dar debt" : "Ku dar Bixin"}
              </h2>
              <button
                onClick={() => {
                  setShowTransactionForm(false);
                  setDescription("");
                  setAmount("");
                  setSelectedCustomer(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAddTransaction}>
                <div className="space-y-6">
                  {/* Customer Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xulo Macmiil <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <select
                        value={selectedCustomer?._id || ""}
                        onChange={(e) => {
                          const customerId = e.target.value;
                          const customer = customers.find(c => c._id === customerId);
                          setSelectedCustomer(customer || null);
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="">Xulo macmiil...</option>
                        {customers.map((customer) => {
                          const customerName = customer.name || customer.customerName || "No Name";
                          return (
                            <option key={customer._id} value={customer._id}>
                              {customerName} {customer.phone ? `(${customer.phone})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sharaxaad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                      <textarea
                        placeholder="Geli sharaxaadda waxqabadka..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lacagta (USD) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        placeholder="Geli lacagta"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-700 font-medium mb-2">Macmiilka:</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedCustomer.name || selectedCustomer.customerName}
                    </p>
                    <div className="mt-2 flex justify-between">
                      <span className="text-sm text-gray-600">Haraaga hadda:</span>
                      <span className={`text-sm font-bold ${calculateTotals(selectedCustomer).balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney(calculateTotals(selectedCustomer).balance)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactionForm(false);
                      setDescription("");
                      setAmount("");
                      setSelectedCustomer(null);
                    }}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Jooji
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !amount || !description || !selectedCustomer}
                    className={`flex-1 py-3 px-4 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
                      transactionType === "debt" 
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" 
                        : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        Ku darayo...
                      </span>
                    ) : transactionType === "debt" ? (
                      "Ku dar debt"
                    ) : (
                      "Ku dar Bixin"
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

export default debt;

// Add missing Minus icon component
const Minus = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className || ""}
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);