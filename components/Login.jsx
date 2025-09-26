import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, UserCheck, X } from 'lucide-react';
import DataService from './services/DataService.jsx';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await DataService.getCurrentUser();
          if (response.success && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            console.error("Token validation failed:", response.message);
            DataService.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("An unexpected error occurred during token validation:", error);
          DataService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await DataService.login({ email, password });
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
  
  const register = async (userData) => {
    try {
      const response = await DataService.register(userData);
      return response;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    DataService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = { user, isAuthenticated, loading, login, logout, register };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, showLogin: true }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};


export const StaffLoginPortal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      if (result.user.role === 'admin' || result.user.role === 'employee') {
        onClose();
        const redirectPath = result.user.role === 'admin' ? '/owner' : '/employee';
        navigate(redirectPath, { replace: true });
      } else {
        setError('Access denied. This portal is for staff only.');
      }
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
     <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Staff Portal</h2>
                <p className="text-sm text-gray-500">Admin & Employee Login</p>
              </div>
              <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
             <div>
                <label className="text-sm font-medium">Email</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded mt-1"
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-2 border rounded mt-1"
                        required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-blue-400"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const CustomerLoginPortal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLoginView) {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        onClose();
        navigate('/my-bookings', { replace: true });
      } else {
        setError(result.message || 'Login failed.');
      }
    } else {
      const result = await register(formData);
      if (result.success) {
        alert('Registration successful! Please log in.');
        setIsLoginView(true);
        setError('');
        setFormData({ firstName: '', lastName: '', email: '', password: '' });
      } else {
        setError(result.message || 'Registration failed.');
      }
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isLoginView ? 'Customer Login' : 'Create Account'}</h2>
              <p className="text-sm text-gray-500">{isLoginView ? 'Access your dashboard' : 'Get started with us'}</p>
            </div>
            <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {!isLoginView && (
              <>
                <input type="text" placeholder="First Name" onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-2 border rounded" required />
                <input type="text" placeholder="Last Name" onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-2 border rounded" required />
              </>
            )}
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2 border rounded" required />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border rounded" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center">
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-blue-400">
              {loading ? 'Processing...' : isLoginView ? 'Sign In' : 'Register'}
            </button>
            <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="w-full text-center text-sm text-blue-600 hover:underline">
              {isLoginView ? 'Need an account? Register' : 'Already have an account? Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
