import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../components/Login.jsx';
import DataService from '../../components/services/DataService.jsx';
import { Upload, Car, MapPin, X, CheckCircle, Clock, AlertCircle, Eye, FileUp, Building, User as UserIcon, Star, Bell, Settings, LogOut, Calendar as CalendarIcon, MessageSquare, BarChart2 } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import BookingModal from '../../components/BookingModal.jsx';
import { useSocket } from '../../hooks/useSocket.jsx'; // --- IMPORT useSocket ---

const CustomerDashboard = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { notifications } = useSocket(); // --- USE the useSocket hook ---
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [feedback, setFeedback] = useState({ rating: 0, comment: '' });

    const fetchBookings = useCallback(async () => {
        if (isAuthenticated) {
            setLoading(true);
            setError(null);
            try {
                const response = await DataService.fetchUserBookings();
                if (response.success) {
                    setBookings(response.data);
                } else {
                    throw new Error(response.message || "Could not fetch bookings.");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleFeedbackSubmit = async () => {
        if (feedback.rating > 0 && selectedBooking) {
            await DataService.submitFeedback({ ...feedback, bookingId: selectedBooking._id, item: selectedBooking.itemId._id, itemModel: selectedBooking.itemModel });
            alert('Feedback submitted!');
            setSelectedBooking(null);
            fetchBookings();
        }
    };

    const calendarEvents = bookings.map(b => ({
      title: b.itemId?.title || `${b.itemId?.brand} ${b.itemId?.model}`,
      start: b.startDate,
      end: b.endDate,
      backgroundColor: b.status === 'confirmed' ? '#10B981' : b.status === 'pending' ? '#F59E0B' : '#EF4444',
      borderColor: b.status === 'confirmed' ? '#10B981' : b.status === 'pending' ? '#F59E0B' : '#EF4444'
    }));
    
    const stats = {
        total: bookings.length,
        active: bookings.filter(b => b.status === 'confirmed').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        cancelled: bookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).length
    };

    if (loading && isAuthenticated) {
        return <div className="text-center p-10">Loading your dashboard...</div>;
    }

    // Guest View
    if (!isAuthenticated) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold text-center mb-6">Book as a Guest</h1>
                <BookingModal isOpen={true} onClose={() => {}} guestMode={true} />
            </div>
        );
    }
    
    // Registered User View
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                    <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
                    <p className="text-lg text-gray-600 mt-2">Here's an overview of your travels with us.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Bookings" value={stats.total} icon={BarChart2} />
                    <StatCard title="Upcoming Trips" value={stats.active} icon={Car} />
                    <StatCard title="Pending Payments" value={stats.pending} icon={Clock} />
                    <StatCard title="Cancelled/Rejected" value={stats.cancelled} icon={X} />
                </div>

                <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg shadow-sm">
                    {['dashboard', 'bookings', 'payments', 'notifications', 'calendar', 'feedback', 'settings'].map(tab => (
                       <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                           {tab.replace('_', ' & ')}
                       </button>
                    ))}
                </div>

                <div className="bg-white p-6 rounded-b-lg shadow-md">
                   {activeTab === 'bookings' && <BookingsList bookings={bookings} onSelectBooking={setSelectedBooking} />}
                   {activeTab === 'calendar' && <BookingCalendar events={calendarEvents} />}
                   {activeTab === 'feedback' && <FeedbackSection bookings={bookings} onFeedbackSubmit={handleFeedbackSubmit} setFeedback={setFeedback} feedback={feedback} setSelectedBooking={setSelectedBooking}/>}
                   {activeTab === 'notifications' && <NotificationsPanel notifications={notifications} />}
                   {activeTab === 'settings' && <AccountSettings user={user} />}
                </div>
            </div>
        </div>
    );
};

// Sub-components for clarity
const StatCard = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-5 rounded-lg shadow-md flex items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500">{title}</p>
        </div>
    </div>
);

const BookingsList = ({ bookings, onSelectBooking }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
        <div className="space-y-4">
            {bookings.map(booking => (
                <div key={booking._id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold">{booking.itemId?.title || `${booking.itemId?.brand} ${booking.itemId?.model}`}</p>
                        <p className="text-sm text-gray-500">{booking.bookingReference}</p>
                    </div>
                    <div>
                         <p className="font-semibold">₱{booking.totalPrice.toLocaleString()}</p>
                         <span className={`px-2 py-1 text-xs rounded-full ${
                             booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                             booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                             'bg-red-100 text-red-800'
                         }`}>{booking.status}</span>
                    </div>
                    <button onClick={() => onSelectBooking(booking)} className="bg-gray-200 px-3 py-1 rounded">Details</button>
                </div>
            ))}
        </div>
    </div>
);

const BookingCalendar = ({ events }) => (
    <div>
      <h2 className="text-2xl font-bold mb-4">Booking Calendar</h2>
      <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
      />
    </div>
);

const FeedbackSection = ({ bookings, onFeedbackSubmit, setFeedback, feedback, setSelectedBooking }) => (
     <div>
        <h2 className="text-2xl font-bold mb-4">Feedback & Reviews</h2>
        <select onChange={(e) => setSelectedBooking(bookings.find(b => b._id === e.target.value))} className="p-2 border rounded w-full mb-4">
            <option value="">Select a completed booking to review</option>
            {bookings.filter(b => b.status === 'completed').map(b => (
                <option key={b._id} value={b._id}>{b.itemId?.title || `${b.itemId?.brand} ${b.itemId?.model}`}</option>
            ))}
        </select>
        <div className="flex mb-4">
            {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} onClick={() => setFeedback({ ...feedback, rating: star })} className={`cursor-pointer ${feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
        <textarea value={feedback.comment} onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })} className="p-2 border rounded w-full" placeholder="Share your experience..."></textarea>
        <button onClick={onFeedbackSubmit} className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Submit Review</button>
    </div>
);

const NotificationsPanel = ({ notifications }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">Notifications</h2>
        <div className="space-y-3">
            {notifications.map(notif => (
                <div key={notif.id} className={`p-4 rounded-lg flex items-start gap-3 ${notif.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {notif.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600"/> : <AlertCircle className="w-5 h-5 text-red-600"/>}
                    <p className="text-sm">{notif.message}</p>
                </div>
            ))}
        </div>
    </div>
);

const AccountSettings = ({ user }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
        <div className="space-y-4">
            <input type="text" defaultValue={user.firstName} className="p-2 border rounded w-full" placeholder="First Name"/>
            <input type="text" defaultValue={user.lastName} className="p-2 border rounded w-full" placeholder="Last Name"/>
            <input type="email" defaultValue={user.email} className="p-2 border rounded w-full" placeholder="Email"/>
            <input type="password" className="p-2 border rounded w-full" placeholder="New Password"/>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Update Profile</button>
        </div>
    </div>
);


export default CustomerDashboard;