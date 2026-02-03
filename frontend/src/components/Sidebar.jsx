// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";

const Sidebar = () => {
  const { user, logout } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!user) return null;

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    if (user?.role === "admin") {
      return [
        { path: "/admin-dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/customers", icon: Users, label: "Customers" },
        { path: "/products", icon: Package, label: "Products" },
        { path: "/sales", icon: ShoppingBag, label: "Sales" },
        { path: "/users", icon: Users, label: "Users" },
        { path: "/settings", icon: Settings, label: "Settings" },
      ];
    } else if (user?.role === "user") {
      return [
        { path: "/admin-dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/customers", icon: Users, label: "Customers" },
        { path: "/sales", icon: ShoppingBag, label: "Sales" },
      ];
    }
    return [];
  };

  const navItems = getMenuItems();

  const linkClasses = (path) => {
    const isActive = location.pathname === path;
    const baseClasses = `
      flex items-center space-x-3 px-4 py-3.5 transition-all duration-200 rounded-lg
      ${isMobile ? 'mx-2' : ''}
      ${collapsed && !isMobile ? 'justify-center px-3' : ''}
    `;

    if (theme === 'dark') {
      return `
        ${baseClasses}
        ${isActive 
          ? 'bg-green-600 text-white border-l-4 border-green-400' 
          : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:border-l-4 hover:border-green-300'
        }
      `;
    } else {
      return `
        ${baseClasses}
        ${isActive 
          ? 'bg-green-600 text-white border-l-4 border-white' 
          : 'text-gray-700 hover:bg-green-50 hover:text-green-600 hover:border-l-4 hover:border-green-200'
        }
      `;
    }
  };

  // Sidebar classes
  const sidebarClasses = `
    ${isMobile 
      ? `fixed inset-y-0 left-0 z-50 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
         transition-transform duration-300 ease-in-out w-64`
      : `fixed left-0 top-0 h-screen z-50 transition-all duration-300
         ${collapsed ? 'w-16' : 'w-56'}`
    }
    ${theme === 'dark' 
      ? 'bg-gray-900 border-r border-gray-800' 
      : 'bg-white border-r border-green-100'
    }
    flex flex-col
  `;

  // Mobile overlay
  const MobileOverlay = () => (
    mobileOpen && isMobile && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setMobileOpen(false)}
      />
    )
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className={`
            fixed top-4 left-4 z-50 p-2 rounded-lg
            ${theme === 'dark' 
              ? 'bg-gray-800 text-white' 
              : 'bg-green-600 text-white'
            }
            shadow-lg
          `}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-green-100'}`}>
          <div className={`flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
            {(!collapsed || isMobile) && (
              <h1 className={`
                text-xl font-bold
                ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}
              `}>
                {user.role === "admin" ? "Admin Panel" : "User Panel"}
              </h1>
            )}
            {!isMobile && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={`
                  p-1 rounded transition-colors
                  ${theme === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-green-50 text-green-600'
                  }
                `}
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        {(!collapsed || isMobile) && (
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-green-100'}`}>
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${theme === 'dark' ? 'bg-green-700' : 'bg-green-600'}
              `}>
                <span className="text-white font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className={`
                  text-sm font-semibold
                  ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
                `}>
                  {user.username}
                </p>
                <p className={`
                  text-xs
                  ${theme === 'dark' ? 'text-green-300' : 'text-green-500'}
                `}>
                  {user.role === "admin" ? "Administrator" : "User"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={linkClasses(item.path)}
                onClick={handleLinkClick}
                title={(collapsed && !isMobile) ? item.label : ''}
              >
                <Icon size={20} />
                {(!collapsed || isMobile) && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 space-y-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-green-100'}`}>
          <button
            onClick={() => {
              logout();
              navigate("/login");
              if (isMobile) setMobileOpen(false);
            }}
            className={`
              w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg
              transition-colors duration-200
              ${theme === 'dark' 
                ? 'bg-green-700 hover:bg-green-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
              ${collapsed && !isMobile ? 'px-3' : ''}
            `}
            title={(collapsed && !isMobile) ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {(!collapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;