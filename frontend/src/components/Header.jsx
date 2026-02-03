// src/components/Header.jsx
import { Link } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useTheme } from "../hooks/useTheme";
import { 
  ShoppingBag, 
  User, 
  Sun, 
  Moon,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  return (
    <header className={`
      sticky top-0 z-40 w-full
      ${theme === 'dark' 
        ? 'bg-gray-900 border-b border-gray-800' 
        : 'bg-white border-b border-green-100'
      }
      shadow-sm
    `}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className={`
              p-2 rounded-lg
              ${theme === 'dark' ? 'bg-green-700' : 'bg-green-600'}
            `}>
              <ShoppingBag className="text-white" size={24} />
            </div>
            <span className={`
              text-xl font-bold
              ${theme === 'dark' ? 'text-white' : 'text-green-700'}
            `}>
              ShopMart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-green-50 text-green-600'
                    }
                  `}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* User Menu */}
                <div className="relative group">
                  <button className={`
                    flex items-center space-x-2 p-2 rounded-lg transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-green-50 text-green-600'
                    }
                  `}>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${theme === 'dark' ? 'bg-green-700' : 'bg-green-600'}
                    `}>
                      <span className="text-white text-sm font-bold">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`
                    absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg
                    ${theme === 'dark' 
                      ? 'bg-gray-800 border border-gray-700' 
                      : 'bg-white border border-green-100'
                    }
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200
                  `}>
                    <Link
                      to="/profile"
                      className={`
                        flex items-center space-x-3 px-4 py-3 transition-colors
                        ${theme === 'dark' 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-green-50 text-green-600'
                        }
                      `}
                    >
                      <User size={18} />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 transition-colors
                        ${theme === 'dark' 
                          ? 'hover:bg-gray-700 text-red-400' 
                          : 'hover:bg-red-50 text-red-600'
                        }
                      `}
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Theme Toggle for non-logged users */}
                <button
                  onClick={toggleTheme}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-green-50 text-green-600'
                    }
                  `}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <Link
                  to="/login"
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-800' 
                      : 'text-green-600 hover:bg-green-50'
                    }
                  `}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${theme === 'dark' 
                      ? 'bg-green-700 text-white hover:bg-green-600' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }
                  `}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`
              md:hidden p-2 rounded-lg transition-colors
              ${theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-green-50 text-green-600'
              }
            `}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`
            md:hidden mt-4 pb-4 border-t pt-4
            ${theme === 'dark' 
              ? 'border-gray-800' 
              : 'border-green-100'
            }
          `}>
            {user ? (
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${theme === 'dark' ? 'bg-green-700' : 'bg-green-600'}
                  `}>
                    <span className="text-white font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {user.username}
                    </p>
                    <p className="text-sm opacity-70">
                      {user.role === 'admin' ? 'Administrator' : 'User'}
                    </p>
                  </div>
                </div>

                {/* Theme Toggle Mobile */}
                <button
                  onClick={toggleTheme}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-green-50 text-green-600'
                    }
                  `}
                >
                  <span>Theme</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </div>
                </button>

                {/* Links */}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block p-3 rounded-lg transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-green-50 text-green-600'
                    }
                  `}
                >
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className={`
                    w-full text-left p-3 rounded-lg transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-red-900/20 text-red-400' 
                      : 'hover:bg-red-50 text-red-600'
                    }
                  `}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-green-50 text-green-600'
                    }
                  `}
                >
                  <span>Theme</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </div>
                </button>

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block p-3 rounded-lg text-center transition-colors
                    ${theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-800' 
                      : 'text-green-600 hover:bg-green-50'
                    }
                  `}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block p-3 rounded-lg text-center transition-colors
                    ${theme === 'dark' 
                      ? 'bg-green-700 text-white hover:bg-green-600' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }
                  `}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;