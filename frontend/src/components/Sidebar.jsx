// src/components/Sidebar.jsx (Green and White Version)
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  CreditCard, 
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user || user.role !== "admin") return null;

  const linkClasses = (path) => {
    const isActive = location.pathname === path;
    return `
      flex items-center space-x-3 px-4 py-3.5 transition-all duration-200
      ${isActive 
        ? 'bg-green-600 text-white border-r-4 border-white' 
        : 'text-gray-700 hover:bg-green-50 hover:text-green-600 hover:border-r-4 hover:border-green-200'
      }
      ${collapsed ? 'justify-center px-3' : ''}
    `;
  };

  const navItems = [
    { path: "/admin-dashboard", icon: LayoutDashboard, label: "Dashboard" },
     { path: "/customers", icon: Users, label: "Customers" },
    { path: "/products", icon: Package, label: "Products" },
     { path: "/sales", icon: ShoppingBag, label: "Sales" },
    // { path: "/debt", icon: CreditCard, label: "Debts" },
     { path: "/Repairing", icon: UserCheck, label: "Repairing" },
  ];

  return (
    <aside className={`
      fixed left-0 top-0 h-screen bg-white border-r border-green-100 
      flex flex-col z-50 transition-all duration-300
      ${collapsed ? 'w-16' : 'w-56'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-green-100">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <h1 className="text-xl font-bold text-green-700">Admin Panel</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-green-50 text-green-600"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* User Info (only when expanded) */}
      {!collapsed && (
        <div className="p-4 border-b border-green-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user.username}</p>
              <p className="text-xs text-green-500">Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={linkClasses(item.path)}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-green-100">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className={`
            w-full flex items-center space-x-3 px-4 py-3 rounded-lg
            bg-green-600 text-white hover:bg-green-700 transition-colors duration-200
            ${collapsed ? 'justify-center px-3' : ''}
          `}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;