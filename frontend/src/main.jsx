// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './hooks/useUser';
import { ThemeProvider } from './hooks/useTheme'; // Import ThemeProvider
import App from './App.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './components/Home.jsx';

// Admin pages
import AdminDashboard from './admin/AdminDashboard.jsx';
import Customers from './admin/Customers.jsx';
import Products from './admin/Products.jsx';
import Sales from './admin/Sales.jsx';
import Users from './admin/Users.jsx';
import Settings from './admin/Settings.jsx'; // Import Settings

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children: [
      { 
        path: '/', 
        element: <Home /> 
      },
      { 
        path: '/login', 
        element: <Login/> 
      },
      { 
        path: '/register', 
        element: <Register/> 
      },
      { 
        path: '/admin-dashboard', 
        element: <AdminDashboard /> 
      },
      { 
        path: '/customers', 
        element: <Customers /> 
      },
      { 
        path: '/sales', 
        element: <Sales /> 
      },
      { 
        path: "/products",
        element: <Products />
      },
      { 
        path: "/users", 
        element: <Users /> 
      },
      { 
        path: "/settings", 
        element: <Settings /> 
      }
    ]
  }
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <UserProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#22c55e',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <RouterProvider router={router} />
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
);