import { Link, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa6";

const Header = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation(); // ✅ si aan u ogaano meesha hadda la joogo

  useEffect(() => {
    // if (!user) navigate("/login");
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ function fudud oo hubinaya haddii link-gu yahay active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-green-600 text-white p-2 shadow-lg sticky top-0 z-50">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Logo / Title */}
        <div className="flex items-center space-x-2">
          {user ? (
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-white">
                <FaUser className="text-xl" />
                <span className="text-xl md:text-2xl font-bold uppercase">
                  {user?.username}
                </span>
              </div>
            </Link>
          ) : (
            <h1 className="text-xl md:text-2xl font-bold text-white">
              POS System
            </h1>
          )}
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-green-700 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 items-center">
          {user ? (
            <>
              

              <li>
                <button
                  onClick={logout}
                  className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Kabax
                </button>
              </li>
            </>
          ) : (
            <>
          
              <li>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isActive("/login") ? "bg-white text-green-700" : "bg-white text-green-600 hover:bg-green-50"
                  }`}
                >
                  Login
                </Link>
              </li>
              
            </>
          )}
        </ul>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden mt-4 bg-green-700 rounded-lg p-4 animate-fadeIn">
          <ul className="flex flex-col space-y-4 text-center">
          
            {user ? (
              <li>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-green-800 hover:bg-green-900 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300"
                >
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className={`block py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      isActive("/login")
                        ? "bg-white text-green-700"
                        : "bg-white text-green-600 hover:bg-green-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
              
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;