import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { X, Search, Edit, Trash2, FileText, Check, AlertCircle } from "lucide-react";

const API_URL = "/api/repairs";

const Repair = () => {
  const [repairs, setRepairs] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    model: "",
    color: "",
    problem: "",
    caseIncluded: "",
    battery: "",
    agreedPrice: "",
    paid: "",
    remaining: ""
  });

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fetch
  const fetchRepairs = async () => {
    try {
      const res = await axios.get(API_URL);
      setRepairs(res.data);
    } catch (error) {
      showNotification("Failed to fetch repairs", "error");
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  // Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };

    if (name === "agreedPrice" || name === "paid") {
      updated.remaining =
        Number(updated.agreedPrice || 0) - Number(updated.paid || 0);
    }

    setForm(updated);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
        showNotification("Repair updated successfully!");
      } else {
        await axios.post(API_URL, form);
        showNotification("Repair added successfully!");
      }

      resetForm();
      fetchRepairs();
    } catch (error) {
      showNotification("Failed to save repair", "error");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      model: "",
      color: "",
      problem: "",
      caseIncluded: "",
      battery: "",
      agreedPrice: "",
      paid: "",
      remaining: ""
    });
    setEditingId(null);
  };

  // Edit
  const handleEdit = (repair) => {
    setForm(repair);
    setEditingId(repair._id);
    showNotification("Editing repair entry", "info");
  };

  // Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this repair?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchRepairs();
        showNotification("Repair deleted successfully!");
      } catch (error) {
        showNotification("Failed to delete repair", "error");
      }
    }
  };

const printInvoice = (r) => {
  try {
    // Dynamically import jsPDF and the AutoTable plugin[citation:2][citation:5]
    import('jspdf').then((jsPDF) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF.default();

        // === 1. COMPANY HEADER & BRANDING ===
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94); // Green brand color
        doc.text(" MOBILE REPAIR SHOP", 105, 20, null, null, 'center');

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Phone: (123) 456-7890 | Address: Mogadishu Somalia", 105, 26, null, null, 'center');

        // === 2. INVOICE METADATA (Auto-generated) ===
        doc.setFontSize(10);
        const currentDate = new Date();
        const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}/${currentDate.getFullYear()}`;
        const formattedDate = currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        
        // Left-aligned: Invoice number[citation:4]
        // Right-aligned: Date[citation:4]
        doc.text(`Invoice #: ${invoiceNumber}`, 14, 32);
        doc.text(`Date: ${formattedDate}`, 196, 32, null, null, 'right');

        // Decorative line[citation:4]
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.5);
        doc.line(14, 34, 196, 34);

        // === 3. DOCUMENT TITLE ===
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(`Repair Invoice for ${r.name}`, 105, 40, null, null, 'center');

        // === 4. KEY CUSTOMER & JOB DETAILS ===
        // Use AutoTable for a clean, structured layout[citation:2][citation:5]
        const customerDetails = [
          ['Customer Name', r.name],
          ['Contact Phone', r.phone],
          ['Device Model', r.model],
          ['Device Color', r.color],
          ['Problem Description', r.problem]
        ];

        autoTable.default(doc, {
          body: customerDetails,
          startY: 45,
          theme: 'plain', // No grid for a clean look
          styles: { fontSize: 11, cellPadding: 5 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' }
          },
          margin: { left: 14 }
        });

        // === 5. SERVICE & CONDITION CHECKLIST ===
        const conditionTableData = [
          ['Case Included?', r.caseIncluded],
          ['Battery Health', r.battery]
        ];

        autoTable.default(doc, {
          body: conditionTableData,
          startY: doc.lastAutoTable.finalY + 10,
          theme: 'plain',
          styles: { fontSize: 11, cellPadding: 5 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' }
          },
          margin: { left: 14 }
        });

        // === 6. FINANCIAL SUMMARY TABLE ===
        const financialData = [
          ['Agreed Repair Price', `$${r.agreedPrice}`],
          ['Amount Paid to Date', `$${r.paid}`],
          ['Remaining Balance', `$${r.remaining}`]
        ];

        autoTable.default(doc, {
          body: financialData,
          startY: doc.lastAutoTable.finalY + 10,
          theme: 'grid', // Use a grid to highlight financial figures[citation:5]
          styles: { fontSize: 11, cellPadding: 6, halign: 'right' },
          headStyles: { fillColor: [34, 197, 94], textColor: 255 }, // Green header
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' } // Left-align the label
          },
          margin: { left: 14, right: 14 }
        });

        // === 7. FOOTER WITH NOTES & SIGNATURE[citation:4] ===
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setTextColor(100); // Gray color
        doc.text("Notes: Warranty valid for 30 days on parts and labor. Please retain this invoice.", 14, finalY);
        doc.text("Customer Signature: __________________________", 14, finalY + 10);
        doc.text("Authorized by: __________________________", 14, finalY + 20);

        // === 8. PAGE FOOTER (Branding on all pages) ===
        const pageCount = doc.internal.pages.length-1;
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`© ${currentDate.getFullYear()} Mobile Repair Shop. Invoice ${invoiceNumber}`, 105, 290, null, null, 'center');
        }

        // === 9. SAVE THE PDF ===
        doc.save(`invoice-${r.name.replace(/\s+/g, '_')}-${formattedDate.replace(/\s+/g, '_')}.pdf`);
        showNotification("Professional invoice generated successfully!");
      });
    }).catch((error) => {
      console.error("Failed to load PDF libraries:", error);
      showNotification("Failed to load PDF generation tools", "error");
    });
  } catch (error) {
    console.error("Error in printInvoice:", error);
    showNotification("Failed to generate invoice", "error");
  }
};
  // Search filter
  const filteredRepairs = repairs.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4 md:p-6">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in ${notification.type === "error" ? "bg-red-50 border-red-200 text-red-800" : notification.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-green-50 border-green-200 text-green-800"} border rounded-lg shadow-lg p-4 max-w-sm`}>
          <div className="flex items-center gap-3">
            {notification.type === "error" ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification({ show: false, message: "", type: "" })} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-green-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <span className="text-white">📱</span>
                </div>
                Repair Management System
              </h1>
              <p className="text-gray-600 mt-2">Track and manage all phone repair orders</p>
            </div>
            
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                placeholder="Search by name or phone..."
                className="pl-10 pr-4 py-3 w-full md:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Form */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit className="w-5 h-5 text-green-600" />
                  Edit Repair Order
                </>
              ) : (
                <>
                  <span className="text-green-600">+</span>
                  New Repair Order
                </>
              )}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Phone Model *</label>
                  <input
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="iPhone 14 Pro"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <input
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    placeholder="Space Black"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Problem Description *</label>
                  <input
                    name="problem"
                    value={form.problem}
                    onChange={handleChange}
                    placeholder="Screen replacement"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Case Included</label>
                  <select
                    name="caseIncluded"
                    value={form.caseIncluded}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Battery</label>
                  <select
                    name="battery"
                    value={form.battery}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Agreed Price ($) *</label>
                  <input
                    type="number"
                    name="agreedPrice"
                    value={form.agreedPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Amount Paid ($)</label>
                  <input
                    type="number"
                    name="paid"
                    value={form.paid}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Remaining Balance ($)</label>
                  <input
                    name="remaining"
                    value={form.remaining}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 font-semibold text-gray-800"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {editingId ? "Update Repair" : "Save Repair"}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Repairs Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Repair Orders ({filteredRepairs.length})</h3>
              <div className="text-sm text-gray-600">
                Total Balance: ${filteredRepairs.reduce((sum, r) => sum + (parseFloat(r.remaining) || 0), 0).toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Customer</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Model</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Agreed</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Paid</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Remain</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRepairs.map((r) => (
                  <tr key={r._id} className="hover:bg-green-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="text-sm text-gray-500">{r.color}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{r.phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{r.model}</div>
                      <div className="text-sm text-gray-500">{r.problem}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-900">${parseFloat(r.agreedPrice).toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-green-600">${parseFloat(r.paid).toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-bold ${parseFloat(r.remaining) > 0 ? "text-red-600" : "text-green-600"}`}>
                        ${parseFloat(r.remaining).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printInvoice(r)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                          title="Generate Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredRepairs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500">No repair orders found</p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-2 text-sm text-green-600 hover:text-green-700"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Repair;