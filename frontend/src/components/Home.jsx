// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     products: 0,
//     customers: 0,
//     todayProfit: 0,
//     monthlyProfit: 0,
//     todayRevenue: 0,
//     todaySales: 0,
//     monthlySales: 0,
//     monthlyRevenue: 0,
//     lowStockProducts: 0,
//     totalInventoryValue: 0
//   });
//   const [salesData, setSalesData] = useState([]);
//   const [productData, setProductData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [timeRange, setTimeRange] = useState('today'); // today, week, month

//   // Colors for charts
//   const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

//   // Fetch all dashboard data
//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch products stats
//       const productsRes = await axios.get('/api/products/stats');
//       const products = await axios.get('/api/products');
      
//       // Fetch customers stats
//       const customersRes = await axios.get('/api/customers');
      
//       // Fetch sales data
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
//       const todaySalesRes = await axios.get(`/api/sales?startDate=${today.toISOString()}`);
//       const monthSalesRes = await axios.get(`/api/sales?startDate=${thisMonth.toISOString()}`);
      
//       // Calculate metrics
//       const totalProducts = productsRes.data.data?.totalProducts || 0;
//       const totalCustomers = customersRes.data.total || 0;
//       const totalInventoryValue = productsRes.data.data?.totalInventoryValue || 0;
//       const lowStockProducts = productsRes.data.data?.lowStockProducts || 0;
      
//       // Calculate today's metrics
//       const todaySales = todaySalesRes.data.data || [];
//       const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
//       const todayProfit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
      
//       // Calculate month's metrics
//       const monthSales = monthSalesRes.data.data || [];
//       const monthlyRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
//       const monthlyProfit = monthSales.reduce((sum, sale) => sum + sale.profit, 0);
      
//       // Prepare sales chart data (last 7 days)
//       const last7Days = [];
//       for (let i = 6; i >= 0; i--) {
//         const date = new Date();
//         date.setDate(date.getDate() - i);
//         date.setHours(0, 0, 0, 0);
        
//         const nextDay = new Date(date);
//         nextDay.setDate(nextDay.getDate() + 1);
        
//         // Filter sales for this day
//         const daySales = monthSales.filter(sale => {
//           const saleDate = new Date(sale.createdAt);
//           return saleDate >= date && saleDate < nextDay;
//         });
        
//         const revenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
//         const profit = daySales.reduce((sum, sale) => sum + sale.profit, 0);
        
//         last7Days.push({
//           date: date.toLocaleDateString('en-US', { weekday: 'short' }),
//           revenue,
//           profit,
//           sales: daySales.length
//         });
//       }
      
//       // Prepare product data for pie chart (top 5 by value)
//       const productsWithValue = products.data.data?.map(product => ({
//         name: product.name,
//         value: product.costPrice * product.quantity,
//         quantity: product.quantity
//       })) || [];
      
//       const topProducts = productsWithValue
//         .sort((a, b) => b.value - a.value)
//         .slice(0, 5);
      
//       setStats({
//         products: totalProducts,
//         customers: totalCustomers,
//         todayProfit,
//         monthlyProfit,
//         todayRevenue,
//         todaySales: todaySales.length,
//         monthlySales: monthSales.length,
//         monthlyRevenue,
//         lowStockProducts,
//         totalInventoryValue
//       });
      
//       setSalesData(last7Days);
//       setProductData(topProducts);
      
//     } catch (err) {
//       console.error('Failed to fetch dashboard data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
    
//     // Refresh data every 30 seconds
//     // const interval = setInterval(fetchDashboardData, 30000);
//     // return () => clearInterval(interval);
//   }, []);

//   // Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount || 0);
//   };

//   // Format number with commas
//   const formatNumber = (num) => {
//     return new Intl.NumberFormat('en-US').format(num || 0);
//   };

//   // Calculate percentage change
//   const calculateChange = (current, previous) => {
//     if (previous === 0) return 100;
//     return ((current - previous) / previous * 100).toFixed(1);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
//       {/* Header */}
//       <div className="mb-8">
//         <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
//           📊 Dashboard Overview
//         </h1>
//         <p className="text-gray-600">
//           Real-time insights and analytics for your business
//         </p>
//       </div>

//       {loading ? (
//         <div className="flex items-center justify-center h-96">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
//         </div>
//       ) : (
//         <>
//           {/* Top Stats Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//             {/* Total Products */}
//             <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 bg-emerald-100 rounded-xl">
//                   <span className="text-2xl text-emerald-600">📦</span>
//                 </div>
//                 <div className="text-right">
//                   <span className="text-sm text-gray-500">Total Products</span>
//                   <p className="text-2xl font-bold text-gray-800">{formatNumber(stats.products)}</p>
//                 </div>
//               </div>
//               <div className="text-sm text-emerald-600 font-medium">
//                 <span>Inventory Value: {formatCurrency(stats.totalInventoryValue)}</span>
//               </div>
//             </div>

//             {/* Total Customers */}
//             {/* <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 bg-blue-100 rounded-xl">
//                   <span className="text-2xl text-blue-600">👥</span>
//                 </div>
//                 <div className="text-right">
//                   <span className="text-sm text-gray-500">Total Customers</span>
//                   <p className="text-2xl font-bold text-gray-800">{formatNumber(stats.customers)}</p>
//                 </div>
//               </div>
//               <div className="text-sm text-blue-600 font-medium">
//                 <span>Active in system</span>
//               </div>
//             </div> */}

//             {/* Today's Profit */}
//             <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 bg-green-100 rounded-xl">
//                   <span className="text-2xl text-green-600">💰</span>
//                 </div>
//                 <div className="text-right">
//                   <span className="text-sm text-gray-500">Today's Profit</span>
//                   <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.todayProfit)}</p>
//                 </div>
//               </div>
//               <div className="text-sm text-green-600 font-medium">
//                 <span>Monthly: {formatCurrency(stats.monthlyProfit)}</span>
//               </div>
//             </div>

//             {/* Today's Revenue */}
//             <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 bg-purple-100 rounded-xl">
//                   <span className="text-2xl text-purple-600">📈</span>
//                 </div>
//                 <div className="text-right">
//                   <span className="text-sm text-gray-500">Today's Revenue</span>
//                   <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.todayRevenue)}</p>
//                 </div>
//               </div>
//               <div className="text-sm text-purple-600 font-medium">
//                 <span>Monthly: {formatCurrency(stats.monthlyRevenue)}</span>
//               </div>
//             </div>
//           </div>

//           {/* Middle Stats Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//             {/* Today's Sales */}
//             <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm opacity-90">Today's Sales</p>
//                   <p className="text-3xl font-bold mt-2">{formatNumber(stats.todaySales)}</p>
//                 </div>
//                 <div className="text-4xl">🛒</div>
//               </div>
//               <div className="mt-4 text-sm opacity-90">
//                 Total transactions for today
//               </div>
//             </div>

//             {/* Monthly Sales */}
//             <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl p-6 shadow-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm opacity-90">Monthly Sales</p>
//                   <p className="text-3xl font-bold mt-2">{formatNumber(stats.monthlySales)}</p>
//                 </div>
//                 <div className="text-4xl">📅</div>
//               </div>
//               <div className="mt-4 text-sm opacity-90">
//                 Total transactions this month
//               </div>
//             </div>

//             {/* Low Stock Alert */}
//             <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm opacity-90">Low Stock Products</p>
//                   <p className="text-3xl font-bold mt-2">{formatNumber(stats.lowStockProducts)}</p>
//                 </div>
//                 <div className="text-4xl">⚠️</div>
//               </div>
//               <div className="mt-4 text-sm opacity-90">
//                 Products needing restock
//               </div>
//             </div>
//           </div>

//           {/* Charts Section */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//             {/* Sales Trend Chart */}
//             <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
//                 <span>📊</span> Sales Trend (Last 7 Days)
//               </h3>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={salesData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis dataKey="date" stroke="#666" />
//                     <YAxis stroke="#666" />
//                     <Tooltip 
//                       formatter={(value) => formatCurrency(value)}
//                       labelStyle={{ color: '#666' }}
//                     />
//                     <Legend />
//                     <Line 
//                       type="monotone" 
//                       dataKey="revenue" 
//                       stroke="#10b981" 
//                       strokeWidth={2}
//                       dot={{ r: 4 }}
//                       activeDot={{ r: 6 }}
//                       name="Revenue"
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="profit" 
//                       stroke="#3b82f6" 
//                       strokeWidth={2}
//                       dot={{ r: 4 }}
//                       activeDot={{ r: 6 }}
//                       name="Profit"
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Top Products Chart */}
//             <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
//                 <span>🏆</span> Top Products by Value
//               </h3>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={productData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                     <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} />
//                     <YAxis stroke="#666" />
//                     <Tooltip 
//                       formatter={(value) => formatCurrency(value)}
//                       labelStyle={{ color: '#666' }}
//                     />
//                     <Bar dataKey="value" name="Inventory Value">
//                       {productData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>

//           {/* Quick Stats */}
//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
//             <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
//               <span>⚡</span> Quick Stats
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
//                 <div className="text-sm text-gray-600 mb-2">Avg. Sale Value</div>
//                 <div className="text-xl font-bold text-emerald-700">
//                   {stats.todaySales > 0 ? formatCurrency(stats.todayRevenue / stats.todaySales) : '$0'}
//                 </div>
//               </div>
              
//               <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
//                 <div className="text-sm text-gray-600 mb-2">Profit Margin</div>
//                 <div className="text-xl font-bold text-blue-700">
//                   {stats.todayRevenue > 0 ? ((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1) : 0}%
//                 </div>
//               </div>
              
//               <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
//                 <div className="text-sm text-gray-600 mb-2">Avg. Monthly Sale</div>
//                 <div className="text-xl font-bold text-purple-700">
//                   {stats.monthlySales > 0 ? formatCurrency(stats.monthlyRevenue / stats.monthlySales) : '$0'}
//                 </div>
//               </div>
              
//               <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
//                 <div className="text-sm text-gray-600 mb-2">Low Stock %</div>
//                 <div className="text-xl font-bold text-amber-700">
//                   {stats.products > 0 ? ((stats.lowStockProducts / stats.products) * 100).toFixed(1) : 0}%
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Summary Cards */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
//               <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
//                 <span className="text-emerald-600">✅</span> Today's Performance
//               </h4>
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Sales Count</span>
//                   <span className="font-bold text-gray-800">{stats.todaySales}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Revenue</span>
//                   <span className="font-bold text-emerald-700">{formatCurrency(stats.todayRevenue)}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Profit</span>
//                   <span className="font-bold text-green-700">{formatCurrency(stats.todayProfit)}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Avg. Profit/Sale</span>
//                   <span className="font-bold text-blue-700">
//                     {stats.todaySales > 0 ? formatCurrency(stats.todayProfit / stats.todaySales) : '$0'}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
//               <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
//                 <span className="text-blue-600">📅</span> Monthly Performance
//               </h4>
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Sales Count</span>
//                   <span className="font-bold text-gray-800">{stats.monthlySales}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Revenue</span>
//                   <span className="font-bold text-blue-700">{formatCurrency(stats.monthlyRevenue)}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Profit</span>
//                   <span className="font-bold text-green-700">{formatCurrency(stats.monthlyProfit)}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Daily Avg. Sales</span>
//                   <span className="font-bold text-purple-700">
//                     {(stats.monthlySales / 30).toFixed(1)}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
//               <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
//                 <span className="text-purple-600">📦</span> Inventory Overview
//               </h4>
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Total Products</span>
//                   <span className="font-bold text-gray-800">{stats.products}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Total Value</span>
//                   <span className="font-bold text-emerald-700">{formatCurrency(stats.totalInventoryValue)}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Low Stock Items</span>
//                   <span className="font-bold text-amber-700">{stats.lowStockProducts}</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Avg. Product Value</span>
//                   <span className="font-bold text-blue-700">
//                     {stats.products > 0 ? formatCurrency(stats.totalInventoryValue / stats.products) : '$0'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
          
//         </>
//       )}

//       {/* Add custom animations */}
//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Dashboard;

import React from 'react'
import Login from '../pages/Login.jsx'

const Home = () => {

  return (
    <Login/>
  )
}

export default Home