import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
    LayoutDashboard, Calendar, FileText, Settings, MessageSquare, Users,
    Car, MapPin, LogOut, Menu, X, Bell, User, ChevronDown, Globe,
    Clock, CheckCircle, AlertTriangle, Eye, Plus, BarChart3, Activity, RefreshCw, RotateCcw, Edit, Archive
} from 'lucide-react';
import { useAuth } from '../../components/Login.jsx';
import DataService from '../../components/services/DataService.jsx';
import BookingCalendar from './BookingCalendar';
import { useSocket } from '../../hooks/useSocket.jsx';

// Re-usable helper components
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { socket } = useSocket();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null); // --- MODIFIED initial state ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isDashboardPage = location.pathname === '/owner' || location.pathname === '/owner/dashboard';

    const navigation = [
        { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
        { name: 'Manage Cars', href: '/owner/manage-cars', icon: Car },
        { name: 'Manage Tours', href: '/owner/manage-tours', icon: MapPin },
        { name: 'Manage Bookings', href: '/owner/manage-bookings', icon: Calendar },
        { name: 'Reports', href: '/owner/reports', icon: FileText },
        { name: 'Content Management', href: '/owner/content-management', icon: Settings },
        { name: 'Messages', href: '/owner/messages', icon: MessageSquare },
        { name: 'Employee Management', href: '/owner/employee-management', icon: Users },
    ];

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await DataService.fetchDashboardAnalytics();
            setDashboardData(response.data);
        } catch (err) {
            setError("Failed to load dashboard data. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDashboardPage) {
            fetchDashboardData();

            socket.on('new-booking', (newBooking) => {
                setDashboardData(prevData => ({
                    ...prevData,
                    summary: {
                        ...prevData.summary,
                        totalBookings: prevData.summary.totalBookings + 1,
                        pendingBookings: prevData.summary.pendingBookings + 1,
                    },
                    recentBookings: [newBooking, ...prevData.recentBookings.slice(0, 4)],
                }));
            });

            return () => {
                socket.off('new-booking');
            };
        }
    }, [isDashboardPage, socket]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    // This is the main view for your dashboard, using your original design with live data.
    const renderDashboardView = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p>Welcome back, {user?.firstName}! Here's a real-time overview of your business.</p>
            </div>
            

            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}
            
            {/* --- ADDED conditional rendering check --- */}
            {loading ? <p>Loading statistics...</p> : dashboardData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Stat Cards */}
                    <StatCard title="Total Cars" value={dashboardData.summary.totalCars || 0} icon={Car} />
                    <StatCard title="Total Tours" value={dashboardData.summary.totalTours || 0} icon={MapPin} />
                    <StatCard title="Total Bookings" value={dashboardData.summary.totalBookings || 0} icon={Calendar} />
                    <StatCard title="Pending Bookings" value={dashboardData.summary.pendingBookings || 0} icon={Clock} />
                    <StatCard title="Total Messages" value={dashboardData.summary.totalMessages || 0} icon={MessageSquare} />
                    <StatCard title="New Messages" value={dashboardData.summary.newMessages || 0} icon={Bell} />
                </div>
            )}
            
            <div className="mt-6">
                 <h2 className="text-2xl font-semibold text-gray-800 mb-4">Booking Calendar</h2>
                 <BookingCalendar />
            </div>

            
            {/* Recent Activity */}
            {/* --- ADDED conditional rendering check --- */}
            {dashboardData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentActivityList title="Recent Bookings" items={dashboardData.recentBookings} type="booking" />
                    <RecentActivityList title="Recent Messages" items={dashboardData.recentMessages} type="message" />
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-indigo-600 to-violet-600">
                    <span className="text-white font-semibold text-lg">DoRayd Admin</span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white"><X /></button>
                </div>
                {/* Navigation */}
                <nav className="mt-2 px-3 flex-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)} className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-xl my-1 ${location.pathname.startsWith(item.href) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                            <item.icon className={`mr-3 h-5 w-5 ${location.pathname.startsWith(item.href) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                 {/* User Info */}
                <div className="p-4 border-t">
                    <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <button onClick={handleLogout} className="w-full mt-2 text-left flex items-center text-sm text-red-600 hover:bg-red-50 p-2 rounded-lg">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </button>
                </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500"><Menu /></button>
                        <h1 className="text-xl font-bold text-slate-800">{navigation.find(nav => location.pathname.startsWith(nav.href))?.name || 'Dashboard'}</h1>
                        <div>{/* Other header items like notifications can go here */}</div>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    {isDashboardPage ? renderDashboardView() : <Outlet />}
                </main>
            </div>
        </div>
    );
};

// Helper components to keep the main component clean
const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border">
    <Icon className="w-8 h-8 text-indigo-500 mb-2" />
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="text-sm text-slate-500">{title}</p>
  </div>
);

const RecentActivityList = ({ title, items, type }) => (
    <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b"><h3 className="text-lg font-semibold">{title}</h3></div>
        <div className="p-4 space-y-3">
            {items.length > 0 ? items.map(item => (
                <div key={item._id} className="flex justify-between items-center text-sm">
                    <div>
                        <p className="font-medium">{type === 'booking' ? item.bookingReference : item.subject}</p>
                        <p className="text-slate-500">{type === 'booking' ? `${item.firstName} ${item.lastName}` : item.name}</p>
                    </div>
                    <div className="text-right">
                        {type === 'booking' && <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>}
                        <p className="text-slate-500">{formatDate(item.createdAt)}</p>
                    </div>
                </div>
            )) : <p className="text-center text-slate-500 py-4">No recent activity.</p>}
        </div>
    </div>
);

export default AdminDashboard;