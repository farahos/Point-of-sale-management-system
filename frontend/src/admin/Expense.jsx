import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Expense = () => {
    const [expenses, setExpenses] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0 });
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });
    const [editing, setEditing] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [currentExpense, setCurrentExpense] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'IN',
        description: '',
       // itemName: '',
        amount: "",
        type_amount: 'Evc',
    });

    const paymentTypes = ['Cash', 'Ecv', 'E-dahab'];

    const API_URL = '/api/expenses';

    // Fetch all expenses
    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL);
            setExpenses(response.data.data || []);
            setSummary(response.data.summary || { totalIn: 0, totalOut: 0, balance: 0 });
            showSnackbar("Expenses loaded successfully", "success");
        } catch (error) {
            showSnackbar("Error fetching expenses", "error");
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Search expenses
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchExpenses();
            return;
        }
        
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/search?query=${searchQuery}`);
            setExpenses(response.data.data || []);
        } catch (error) {
            showSnackbar("Error searching expenses", "error");
        } finally {
            setLoading(false);
        }
    };

    // Filter by date
    const filterByDate = async (date) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/filter?date=${date}`);
            setExpenses(response.data.data || []);
        } catch (error) {
            showSnackbar("Error filtering expenses", "error");
            console.error("Filter error:", error.response || error.message);
        } finally {
            setLoading(false);
        }
    };

    // Generate PDF
    const generatePDF = () => {
        import('jspdf').then((jsPDF) => {
            import('jspdf-autotable').then((autoTable) => {
                const doc = new jsPDF.default();

                // Company Header
                doc.setFontSize(20);
                doc.setTextColor(34, 139, 34);
                doc.text("Tufaax & Fruits Company", 105, 20, null, null, 'center');
                
                // Phone and address
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text("Phone: +252 621 999 366 / +252 682 226 000 | Address: Mogadishu, Somalia", 105, 26, null, null, 'center');
                
                // Date and reference number
                doc.setFontSize(10);
                const currentDate = new Date();
                const referenceNumber = `${Math.floor(1000 + Math.random() * 9000)}/TFC/${currentDate.getFullYear()}`;
                const formattedDate = format(currentDate, 'MMM dd, yyyy');
                doc.text(`Ref No: ${referenceNumber}`, 160, 32);
                doc.text(`Date: ${formattedDate}`, 14, 32);
                
                doc.setDrawColor(34, 139, 34);
                doc.setLineWidth(0.5);
                doc.line(14, 34, 196, 34);

                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text(`Expense Report - ${formattedDate}`, 105, 40, null, null, 'center');

                // Table data
                const tableData = expenses.map((expense, index) => [
                    index + 1,
                    format(new Date(expense.date), 'MMM dd, yyyy'),
                    expense.type,
                    expense.description || '-',
                   // expense.itemName,
                    formatCurrency(expense.amount),
                    expense.type_amount,
                ]);

                // Add table
                autoTable.default(doc, {
                    head: [['#', 'Date', 'Type', 'Item Name', 'Amount ($)', 'Payment Type', 'Description']],
                    body: tableData,
                    startY: 45,
                    headStyles: { fillColor: [34, 139, 34], textColor: 255 },
                    alternateRowStyles: { fillColor: [240, 240, 240] },
                    margin: { top: 10 }
                });

                // Calculate totals
                const totalIn = expenses
                    .filter(expense => expense.type === 'IN')
                    .reduce((sum, expense) => sum + expense.amount, 0);
                
                const totalOut = expenses
                    .filter(expense => expense.type === 'OUT')
                    .reduce((sum, expense) => sum + expense.amount, 0);
                
                const balance = totalIn - totalOut;

                // Add summary
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                const finalY = doc.lastAutoTable.finalY + 10;
                
                doc.text(`Total IN: ${formatCurrency(totalIn)}`, 14, finalY);
                doc.text(`Total OUT: ${formatCurrency(totalOut)}`, 14, finalY + 6);
                doc.text(`Balance: ${formatCurrency(balance)}`, 14, finalY + 12);

                // Footer
                const pageCount = doc.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(10);
                    doc.setTextColor(150);
                    doc.text(`© ${new Date().getFullYear()} Express Technologies. All rights reserved.`, 105, 290, null, null, 'center');
                }

                // Save PDF
                doc.save(`Expense_Report_${selectedDate}.pdf`);
            });
        });
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentExpense(prev => ({
            ...prev,
            [name]: name === "amount" ? parseFloat(value) || 0 : value
        }));
    };

    // Save expense (create or update)
    const handleSaveExpense = async () => {
        try {
            if (editing) {
                await axios.put(`${API_URL}/${currentExpense._id}`, currentExpense);
                showSnackbar("Expense updated successfully", "success");
            } else {
                await axios.post(API_URL, currentExpense);
                showSnackbar("Expense created successfully", "success");
            }
            
            setOpenDialog(false);
            resetForm();
            fetchExpenses();
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Error saving expense", "error");
        }
    };

    // Delete expense
    const handleDelete = async () => {
        try {
            await axios.delete(`${API_URL}/${selectedExpense._id}`);
            showSnackbar("Expense deleted successfully", "success");
            setOpenDeleteDialog(false);
            setSelectedExpense(null);
            fetchExpenses();
        } catch (error) {
            showSnackbar("Error deleting expense", "error");
        }
    };

    // Edit expense
    const handleEdit = (expense) => {
        setCurrentExpense({
            ...expense,
            date: new Date(expense.date).toISOString().split('T')[0]
        });
        setEditing(true);
        setSelectedExpense(expense);
        setOpenDialog(true);
    };

    // Reset form
    const resetForm = () => {
        setCurrentExpense({
            date: new Date().toISOString().split('T')[0],
            type: 'IN',
            description: '',
           // itemName: '',
            amount: 0,
            type_amount: 'Cash',
        });
        setEditing(false);
        setSelectedExpense(null);
    };

    // Open dialog for new expense
    const handleOpenDialog = () => {
        resetForm();
        setOpenDialog(true);
    };

    // Show snackbar notification
    const showSnackbar = (message, severity) => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    // Close snackbar
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">🧾 Expense Tracker (IN & OUT)</h1>

                    {/* Search, Filter, and Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="dateFilter" className="text-gray-700 whitespace-nowrap">Filter by Date:</label>
                            <input
                                type="date"
                                id="dateFilter"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    filterByDate(e.target.value);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search expenses by item name or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Search
                            </button>
                            <button
                                onClick={handleOpenDialog}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <span>+</span>
                                Add Expense
                            </button>
                            <button
                                onClick={generatePDF}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-green-100 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">📈</span>
                            <h3 className="text-lg font-semibold text-green-800">Total IN</h3>
                        </div>
                        <p className="text-3xl font-bold text-green-900">{formatCurrency(summary.totalIn)}</p>
                    </div>
                    
                    <div className="bg-red-100 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-600">📉</span>
                            <h3 className="text-lg font-semibold text-red-800">Total OUT</h3>
                        </div>
                        <p className="text-3xl font-bold text-red-900">{formatCurrency(summary.totalOut)}</p>
                    </div>
                    
                    <div className={`${summary.balance >= 0 ? 'bg-blue-100 border-blue-200' : 'bg-yellow-100 border-yellow-200'} border rounded-lg p-6`}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Balance</h3>
                        <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-900' : 'text-yellow-900'}`}>
                            {formatCurrency(summary.balance)}
                        </p>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Item Name</th> */}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-right">Amount ($)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Payment Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                            No expenses found
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((expense, index) => (
                                        <tr key={expense._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(expense.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    expense.type === 'IN' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {expense.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{expense.description || '-'}</td>
                                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.itemName}</td> */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                {formatCurrency(expense.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    expense.type_amount === 'Cash' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : expense.type_amount === 'Ecv'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {expense.type_amount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedExpense(expense);
                                                            setOpenDeleteDialog(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Expense Dialog */}
            {openDialog && (
                <div className="fixed inset-0  bg-opacity-10 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                {editing ? "Edit Expense" : "Add New Expense"}
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={currentExpense.date}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                        <select
                                            name="type"
                                            value={currentExpense.type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        >
                                            <option value="IN">IN (Income)</option>
                                            <option value="OUT">OUT (Expense)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                                    <input
                                        type="text"
                                        name="itemName"
                                        value={currentExpense.itemName}
                                        onChange={handleInputChange}
                                        placeholder="Enter item name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div> */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={currentExpense.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Enter description..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={currentExpense.amount}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
                                        <select
                                            name="type_amount"
                                            value={currentExpense.type_amount}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        >
                                            {paymentTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                
                            </div>
                            
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setOpenDialog(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveExpense}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    {editing ? "Update" : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {openDeleteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Delete</h2>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete "{selectedExpense?.itemName}" expense?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setOpenDeleteDialog(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar Notification */}
            {snackbar.open && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg ${
                    snackbar.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    <div className="flex items-center">
                        <span>{snackbar.message}</span>
                        <button
                            onClick={handleCloseSnackbar}
                            className="ml-4 text-lg font-semibold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expense;