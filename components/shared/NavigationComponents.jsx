import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield, UserCheck, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../Login';

export const Navbar = ({ onStaffLogin, onLogoClick }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const userMenuRef = useRef(null);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Cars', href: '/cars' },
    { name: 'Tours', href: '/tours' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogoClick = () => {
    setIsMenuOpen(false);
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
    console.log(`👋 User logged out at 2025-09-03 15:18:19`);
  };

  const handleDashboardAccess = () => {
    if (user?.role === 'admin') {
      navigate('/owner/dashboard');
    } else if (user?.role === 'employee') {
      navigate('/employee/dashboard');
    }
    setUserMenuOpen(false);
  };

  const handleStaffLogin = () => {
    if (onStaffLogin) {
      onStaffLogin();
    } else {
      navigate('/admin-login');
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">
                D
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">DoRayd</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.href ? 'text-blue-600 border-b-2 border-blue-600' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    user.role === 'admin' ? 'bg-red-600' : 'bg-green-600'
                  }`}>
                    {user.role === 'admin' ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </div>
                  <span>{user.name || user.email}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-blue-600 capitalize">{user.role} Account</p>
                    </div>
                    
                    <button
                      onClick={handleDashboardAccess}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      {user.role === 'admin' ? 'Admin Dashboard' : 'Employee Dashboard'}
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleStaffLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Staff Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="border-t border-gray-200 pt-3 mt-3">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        user.role === 'admin' ? 'bg-red-600' : 'bg-green-600'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-blue-600 capitalize">{user.role} Account</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleDashboardAccess();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {user.role === 'admin' ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    {user.role === 'admin' ? 'Admin Dashboard' : 'Employee Dashboard'}
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleStaffLogin();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg mx-3 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Staff Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">
                D
              </div>
              <span className="ml-2 text-xl font-bold">DoRayd Travel & Tours</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Your trusted partner for exploring the beautiful Philippines. We provide premium car rentals and exciting tour packages for unforgettable adventures.
            </p>
            <div className="text-sm text-gray-500">
              <p>© {currentYear} DoRayd Travel & Tours. All rights reserved.</p>
              <p className="mt-1">Built with ❤️ for Filipino travelers</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-2 text-xs">
                  Dev Mode | Database Connected | Time: 2025-09-03 15:18:19 | User: BlueDrinkingWater
                </p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'Home', href: '/' },
                { name: 'Car Rental', href: '/cars' },
                { name: 'Tour Packages', href: '/tours' },
                { name: 'About Us', href: '/about' },
                { name: 'Contact', href: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">+63 917 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">info@dorayd.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">Manila, Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">24/7 Customer Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              <Link to="/about" className="hover:text-white transition-colors mr-4">
                Privacy Policy
              </Link>
              <Link to="/about" className="hover:text-white transition-colors mr-4">
                Terms of Service
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              Made with 💙 for Philippine Tourism
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};