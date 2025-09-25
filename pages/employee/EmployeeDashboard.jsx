import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, MessageSquare, Car, MapPin, 
  User, Bell, Settings, LogOut, Menu, X, Eye, CheckCircle,
  Clock, Users, DollarSign, FileText, Shield
} from 'lucide-react';
import { useAuth } from '../../components/Login';
import { useNavigate } from 'react-router-dom';
import DataService from '../../components/services/DataService';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);

  // Check user permissions
  const permissions = user?.permissions || {};

  const navigationItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      permission: true 
    },
    { 
      id: 'cars', 
      name: 'Manage Cars', 
      icon: Car, 
      permission: permissions.canManageCars 
    },
    { 
      id: 'tours', 
      name: 'Manage Tours', 
      icon: MapPin, 
      permission: permissions.canManageTours 
    },
    { 
      id: 'bookings', 
      name: 'Manage Bookings', 
      icon: Calendar, 
      permission: permissions.canManageBookings 
    },
    { 
      id: 'messages', 
      name: 'Customer Messages', 
      icon: MessageSquare, 
      permission: permissions.canViewMessages 
    },
    { 
      id: 'reports', 
      name: 'Reports', 
      icon: FileText, 
      permission: permissions.canViewReports 
    }
  ].filter(item => item.permission);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const promises = [];
      
      if (permissions.canViewReports) {
        promises.push(DataService.fetchDashboardAnalytics());
      }
      
      if (permissions.canManageBookings) {
        promises.push(DataService.fetchAllBookings());
      }

      const results = await Promise.all(promises);
      
      if (permissions.canViewReports && results[0]) {
        setAnalytics(results[0]);
      }
      
      if (permissions.canManageBookings && results[results.length - 1]) {
        setRecentBookings(results[results.length - 1].slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: X },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: X }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.firstName}!</h1>
        <p className="text-green-100">Employee Dashboard - DoRayd Travel & Tours</p>
        <p className="text-green-200 text-sm mt-1">
          Position: {user?.position} | Last Login: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Permission Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Your Permissions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(permissions).map(([key, value]) => (
            <div key={key} className={`p-3 rounded-lg border ${
              value ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-3 h-3 rounded-full mb-2 ${
                value ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <p className={`text-sm font-medium ${
                value ? 'text-green-800' : 'text-gray-500'
              }`}>
                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {permissions.canViewReports && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500">
                <Car className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {analytics.totalCars || 0}
            </h3>
            <p className="text-gray-600 text-sm">Total Cars</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-500">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {analytics.totalTours || 0}
            </h3>
            <p className="text-gray-600 text-sm">Total Tours</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-500">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {analytics.pendingBookings || 0}
            </h3>
            <p className="text-gray-600 text-sm">Pending Bookings</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-emerald-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {analytics.monthlyRevenue ? formatPrice(analytics.monthlyRevenue) : '₱0'}
            </h3>
            <p className="text-gray-600 text-sm">Monthly Revenue</p>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {permissions.canManageBookings && recentBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.bookingReference}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.firstName} {booking.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.bookingType === 'car' ? 
                          `${booking.car?.brand} ${booking.car?.model}` : 
                          booking.tour?.title
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(booking.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Access Restrictions Notice */}
      {Object.values(permissions).filter(Boolean).length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Limited Access</h3>
              <p className="text-yellow-700">
                You don't have permissions for additional features. Contact your administrator to request access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-green-600">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">E</span>
            </div>
            <span className="ml-2 text-white font-semibold text-lg">Employee Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === item.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                  activeTab === item.id ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Employee info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.position}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="ml-2 lg:ml-0 text-xl font-semibold text-gray-900">
                {navigationItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-600">
                Employee: {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'cars' && permissions.canManageCars && (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Car Management</h3>
                  <p className="text-gray-600">Car management functionality would be integrated here.</p>
                </div>
              )}
              {activeTab === 'tours' && permissions.canManageTours && (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tour Management</h3>
                  <p className="text-gray-600">Tour management functionality would be integrated here.</p>
                </div>
              )}
              {activeTab === 'bookings' && permissions.canManageBookings && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Management</h3>
                  <p className="text-gray-600">Booking management functionality would be integrated here.</p>
                </div>
              )}
              {activeTab === 'messages' && permissions.canViewMessages && (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Messages</h3>
                  <p className="text-gray-600">Message management functionality would be integrated here.</p>
                </div>
              )}
              {activeTab === 'reports' && permissions.canViewReports && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
                  <p className="text-gray-600">Reporting functionality would be integrated here.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white text-xs px-2 py-1 rounded">
          Employee: {user?.firstName} | Updated: 2025-09-03 10:14:43
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;