// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { 
//   Search, Users, DollarSign, CreditCard, 
//   AlertCircle, CheckCircle, Clock, Filter,
//   Plus, X, ArrowUpDown, Download, Eye,
//   User, Phone, Calendar, FileText,
//   RefreshCw
// } from "lucide-react";

// const Debts = () => {
//   const [debts, setDebts] = useState([]);
//   const [filteredDebts, setFilteredDebts] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [searchText, setSearchText] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [amount, setAmount] = useState("");
//   const [note, setNote] = useState("");

//   const [payModal, setPayModal] = useState(false);
//   const [payAmount, setPayAmount] = useState("");
//   const [currentDebt, setCurrentDebt] = useState(null);

//   const [activeFilter, setActiveFilter] = useState("all"); // all, pending, partial, paid
//   const [sortBy, setSortBy] = useState("newest");
//   const [showFormModal, setShowFormModal] = useState(false);

//   useEffect(() => {
//     fetchDebts();
//     fetchCustomers();
//   }, []);

//   useEffect(() => {
//     filterAndSortDebts();
//   }, [debts, activeFilter, sortBy]);

//   const fetchDebts = async () => {
//     setIsLoading(true);
//     try {
//       const res = await axios.get("/api/debts");
//       setDebts(res.data);
//     } catch (err) {
//       console.error("Error fetching debts:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchCustomers = async () => {
//     try {
//       const res = await axios.get("/api/customer");
//       setCustomers(res.data);
//     } catch (err) {
//       console.error("Error fetching customers:", err);
//     }
//   };

//   const filterAndSortDebts = () => {
//     let filtered = debts;

//     // Apply status filter
//     if (activeFilter !== "all") {
//       filtered = debts.filter(d => d.status === activeFilter);
//     }

//     // Apply sorting
//     filtered = [...filtered].sort((a, b) => {
//       switch (sortBy) {
//         case "amount-desc":
//           return (b.amount - b.paidAmount) - (a.amount - a.paidAmount);
//         case "amount-asc":
//           return (a.amount - a.paidAmount) - (b.amount - b.paidAmount);
//         case "oldest":
//           return new Date(a.createdAt) - new Date(b.createdAt);
//         case "newest":
//         default:
//           return new Date(b.createdAt) - new Date(a.createdAt);
//       }
//     });

//     setFilteredDebts(filtered);
//   };

//   const searchCustomers = (text) => {
//     setSearchText(text);

//     if (text.length < 1) {
//       setSuggestions([]);
//       return;
//     }

//     const matches = customers.filter((c) =>
//       c.cusPhone.includes(text) ||
//       c.cusname.toLowerCase().includes(text.toLowerCase())
//     );

//     setSuggestions(matches.slice(0, 5)); // Limit to 5 suggestions
//   };

//   const selectCustomer = (customer) => {
//     setSelectedCustomer(customer);
//     setSearchText(`${customer.cusname} (${customer.cusPhone})`);
//     setSuggestions([]);
//   };

//   const saveDebt = async () => {
//     if (!selectedCustomer || !amount) {
//       alert("Please fill all required fields!");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const res = await axios.post("/api/debts", {
//         customer: selectedCustomer._id,
//         amount: Number(amount),
//         note,
//       });

//       alert("Debt added successfully!");
//       resetForm();
//       fetchDebts();
//     } catch (err) {
//       console.error("Error saving debt:", err);
//       alert("Error saving debt. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const openPayModal = (debt) => {
//     setCurrentDebt(debt);
//     setPayAmount("");
//     setPayModal(true);
//   };

//   const payDebt = async () => {
//     if (!payAmount) {
//       alert("Please enter payment amount!");
//       return;
//     }

//     const remaining = currentDebt.amount - currentDebt.paidAmount;

//     if (Number(payAmount) > remaining) {
//       alert(`Maximum payment amount is $${remaining}`);
//       return;
//     }

//     if (Number(payAmount) <= 0) {
//       alert("Please enter a valid amount!");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       await axios.put(`/api/debts/pay/${currentDebt._id}`, {
//         payAmount: Number(payAmount),
//       });

//       alert("Payment recorded successfully!");
//       setPayModal(false);
//       setCurrentDebt(null);
//       fetchDebts();
//     } catch (err) {
//       console.error("Error paying debt:", err);
//       alert("Error processing payment. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setSelectedCustomer(null);
//     setAmount("");
//     setNote("");
//     setSearchText("");
//     setShowFormModal(false);
//   };

//   const getStatusBadge = (status, remaining) => {
//     const baseClass = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    
//     switch (status) {
//       case "paid":
//         return (
//           <span className={`${baseClass} bg-green-100 text-green-800`}>
//             <CheckCircle size={14} className="mr-1" />
//             Paid
//           </span>
//         );
//       case "partial":
//         return (
//           <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>
//             <AlertCircle size={14} className="mr-1" />
//             Partial
//           </span>
//         );
//       case "pending":
//         return (
//           <span className={`${baseClass} ${remaining > 500 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
//             <Clock size={14} className="mr-1" />
//             Pending
//           </span>
//         );
//       default:
//         return (
//           <span className={`${baseClass} bg-gray-100 text-gray-800`}>
//             {status}
//           </span>
//         );
//     }
//   };

//   const totalOutstanding = debts.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
//   const totalDebts = debts.reduce((sum, d) => sum + d.amount, 0);
//   const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Debts Management</h1>
//             <p className="text-gray-600 mt-2">Track and manage customer debts</p>
//           </div>
          
//           <div className="flex gap-3 mt-4 md:mt-0">
//             <button
//               onClick={() => setShowFormModal(true)}
//               className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
//             >
//               <Plus size={20} />
//               Add New Debt
//             </button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div className="bg-white rounded-xl shadow-lg p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-600 text-sm font-medium mb-2">Outstanding Debts</p>
//                 <p className="text-3xl font-bold text-gray-900">
//                   ${totalOutstanding.toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
//                 <CreditCard className="text-red-600" size={28} />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-lg p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-600 text-sm font-medium mb-2">Total Debts</p>
//                 <p className="text-3xl font-bold text-gray-900">
//                   ${totalDebts.toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
//                 <DollarSign className="text-red-600" size={28} />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-lg p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-600 text-sm font-medium mb-2">Amount Collected</p>
//                 <p className="text-3xl font-bold text-gray-900">
//                   ${totalPaid.toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
//                 <CheckCircle className="text-red-600" size={28} />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-8">
//           <div className="flex flex-col md:flex-row gap-4">
//             {/* Search */}
//             <div className="flex-1 relative">
//               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//               <input
//                 type="text"
//                 placeholder="Search customer by name or phone..."
//                 value={searchText}
//                 onChange={(e) => searchCustomers(e.target.value)}
//                 className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
//               />
//               {suggestions.length > 0 && (
//                 <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
//                   {suggestions.map((c) => (
//                     <div
//                       key={c._id}
//                       className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0"
//                       onClick={() => selectCustomer(c)}
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
//                           <User size={16} className="text-red-600" />
//                         </div>
//                         <div>
//                           <p className="font-medium text-gray-900">{c.cusname}</p>
//                           <p className="text-sm text-gray-600 flex items-center gap-1">
//                             <Phone size={14} />
//                             {c.cusPhone}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Filters */}
//             <div className="flex gap-2">
//               <select
//                 value={activeFilter}
//                 onChange={(e) => setActiveFilter(e.target.value)}
//                 className="bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
//               >
//                 <option value="all">All Debts</option>
//                 <option value="pending">Pending</option>
//                 <option value="partial">Partial</option>
//                 <option value="paid">Paid</option>
//               </select>

//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//                 className="bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
//               >
//                 <option value="newest">Newest First</option>
//                 <option value="oldest">Oldest First</option>
//                 <option value="amount-desc">Amount (High to Low)</option>
//                 <option value="amount-asc">Amount (Low to High)</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Debts List */}
//         <div className="bg-white rounded-xl shadow-md overflow-hidden">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-xl font-semibold text-gray-800">Debts Overview</h2>
//                 <p className="text-gray-600 text-sm mt-1">
//                   {filteredDebts.length} debt{filteredDebts.length !== 1 ? 's' : ''} found
//                 </p>
//               </div>
//               <button
//                 onClick={fetchDebts}
//                 disabled={isLoading}
//                 className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
//               >
//                 <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
//                 Refresh
//               </button>
//             </div>
//           </div>

//           {isLoading ? (
//             <div className="flex justify-center items-center py-16">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
//             </div>
//           ) : filteredDebts.length === 0 ? (
//             <div className="text-center py-16">
//               <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
//                 <CreditCard size={48} className="text-gray-400" />
//               </div>
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No debts found</h3>
//               <p className="text-gray-600 mb-6">Get started by adding your first debt</p>
//               <button
//                 onClick={() => setShowFormModal(true)}
//                 className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
//               >
//                 <Plus size={18} />
//                 Add Debt
//               </button>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Customer
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Total Amount
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Paid Amount
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Outstanding
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredDebts.map((d) => {
//                     const outstanding = d.amount - d.paidAmount;
//                     const paidPercentage = (d.paidAmount / d.amount) * 100;
                    
//                     return (
//                       <tr key={d._id} className="hover:bg-gray-50 transition-colors duration-150">
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center">
//                             <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
//                               <User size={20} className="text-red-600" />
//                             </div>
//                             <div>
//                               <div className="text-sm font-medium text-gray-900">
//                                 {d.customer?.cusname || 'Unknown'}
//                               </div>
//                               <div className="text-sm text-gray-500">
//                                 {d.customer?.cusPhone || 'N/A'}
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-sm font-medium text-gray-900">
//                             ${d.amount?.toLocaleString()}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-sm text-green-600 font-medium">
//                             ${d.paidAmount?.toLocaleString()}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div>
//                             <div className="text-sm font-bold text-red-600">
//                               ${outstanding.toLocaleString()}
//                             </div>
//                             {/* Progress bar */}
//                             <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
//                               <div 
//                                 className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
//                                 style={{ width: `${100 - paidPercentage}%` }}
//                               ></div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           {getStatusBadge(d.status, outstanding)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                           <div className="flex gap-2">
//                             <button
//                               onClick={() => openPayModal(d)}
//                               className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-4 rounded-md transition-all duration-200"
//                               disabled={outstanding === 0}
//                             >
//                               <DollarSign size={16} />
//                               Pay
//                             </button>
//                             <button
//                               className="inline-flex items-center gap-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors duration-200"
//                             >
//                               <Eye size={16} />
//                               View
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Add Debt Modal */}
//       {showFormModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between p-6 border-b border-gray-200">
//               <h2 className="text-2xl font-bold text-gray-900">Add New Debt</h2>
//               <button
//                 onClick={resetForm}
//                 className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
//               >
//                 <X size={24} />
//               </button>
//             </div>

//             <form className="p-6" onSubmit={(e) => { e.preventDefault(); saveDebt(); }}>
//               <div className="space-y-6">
//                 {/* Customer Search */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Customer <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                     <input
//                       type="text"
//                       placeholder="Search customer by name or phone..."
//                       value={searchText}
//                       onChange={(e) => searchCustomers(e.target.value)}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                       required
//                     />
//                   </div>
//                   {selectedCustomer && (
//                     <div className="mt-2 p-3 bg-red-50 rounded-lg">
//                       <p className="font-medium text-gray-900">{selectedCustomer.cusname}</p>
//                       <p className="text-sm text-gray-600">{selectedCustomer.cusPhone}</p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Amount */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Amount <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                     <input
//                       type="number"
//                       placeholder="Enter debt amount"
//                       value={amount}
//                       onChange={(e) => setAmount(e.target.value)}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                       required
//                       min="1"
//                       step="0.01"
//                     />
//                   </div>
//                 </div>

//                 {/* Note */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Note (Optional)
//                   </label>
//                   <div className="relative">
//                     <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
//                     <textarea
//                       placeholder="Add any notes about this debt..."
//                       value={note}
//                       onChange={(e) => setNote(e.target.value)}
//                       rows={3}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={resetForm}
//                   className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isLoading || !selectedCustomer || !amount}
//                   className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
//                       Saving...
//                     </span>
//                   ) : (
//                     "Save Debt"
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Payment Modal */}
//       {payModal && currentDebt && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
//             <div className="flex items-center justify-between p-6 border-b border-gray-200">
//               <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
//               <button
//                 onClick={() => setPayModal(false)}
//                 className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
//               >
//                 <X size={24} />
//               </button>
//             </div>

//             <div className="p-6">
//               <div className="space-y-4">
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
//                       <User size={24} className="text-red-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-gray-900">{currentDebt.customer?.cusname}</h3>
//                       <p className="text-gray-600">{currentDebt.customer?.cusPhone}</p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="p-3 bg-white rounded-lg border">
//                       <p className="text-sm text-gray-600">Total Debt</p>
//                       <p className="text-xl font-bold text-gray-900">
//                         ${currentDebt.amount?.toLocaleString()}
//                       </p>
//                     </div>
//                     <div className="p-3 bg-white rounded-lg border">
//                       <p className="text-sm text-gray-600">Already Paid</p>
//                       <p className="text-xl font-bold text-green-600">
//                         ${currentDebt.paidAmount?.toLocaleString()}
//                       </p>
//                     </div>
//                     <div className="p-3 bg-white rounded-lg border col-span-2">
//                       <p className="text-sm text-gray-600">Outstanding Balance</p>
//                       <p className="text-xl font-bold text-red-600">
//                         ${(currentDebt.amount - currentDebt.paidAmount).toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Payment Amount <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                     <input
//                       type="number"
//                       placeholder={`Enter amount (Max: $${(currentDebt.amount - currentDebt.paidAmount).toLocaleString()})`}
//                       value={payAmount}
//                       onChange={(e) => setPayAmount(e.target.value)}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                       max={currentDebt.amount - currentDebt.paidAmount}
//                       min="1"
//                       step="0.01"
//                     />
//                   </div>
//                   {payAmount && (
//                     <p className="text-sm text-gray-600 mt-2">
//                       New outstanding: ${(currentDebt.amount - currentDebt.paidAmount - Number(payAmount)).toLocaleString()}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={() => setPayModal(false)}
//                   className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={payDebt}
//                   disabled={isLoading || !payAmount || Number(payAmount) <= 0}
//                   className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
//                       Processing...
//                     </span>
//                   ) : (
//                     "Confirm Payment"
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Debts;
import React from 'react'

const Debts = () => {
  return (
    <div>
      comming soon...
    </div>
  )
}

export default Debts
