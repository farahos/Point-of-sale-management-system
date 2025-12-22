
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './hooks/useUser';
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login.jsx';




import Register from './pages/Register.jsx';
import Home from './components/Home.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';


import Customers from './admin/Customers.jsx';
import Products from './admin/Products.jsx';
import Sales from './admin/Sales.jsx';
import Debts from './admin/Debts.jsx';
import Repairing from './admin/Repairing.jsx';
import Users from './admin/users.jsx';




const router = createBrowserRouter([
  {
    path: "/", element: <App/>,
    children:[
         { path: '/', 
          element: <Home /> },
        { path: '/login', 
          element: <Login/> },
            { path: '/Register', 
          element: <Register/> },

  
        
         
           { path: '/admin-dashboard', 
          element: <AdminDashboard /> },
           { path: '/Customers', 
          element: <Customers /> },
           { path: '/sales', 
          element: <Sales /> },
     
      
       {  path:"/products",
        element:<Products />},
        {path:"/debt",
        element:<Debts/> },
        {path:"/repairing",
        element:<Repairing/> },
        {path:"/users",
        element:<Users/> },

        

         
    ]
  
  }
])
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>

    <Toaster />
    <RouterProvider router={router} />
    </UserProvider>

  </React.StrictMode>
);
