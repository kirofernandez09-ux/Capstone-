import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../components/Login.jsx';
import DataService from '../../components/services/DataService.jsx';
import { Star, Edit, Trash2, CheckCircle, Clock, X, BarChart2, Car, MapPin, Send, User, MessageSquare, Calendar as CalendarIcon, Bell, Settings } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSocket } from '../../hooks/useSocket.jsx';

const CustomerDashboard = () => {
    const { user, isAuthenticated } = useAuth();
    const { notifications } = useSocket();
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('bookings');

    const fetchData = useCallback(async () => {
        if (isAuthenticated) {
            setLoading(true);
            setError(null);
            try {
                const [bookingsRes, reviewsRes] = await Promise.all([
                    DataService.fetchUserBookings(),
                    DataService.getMyReviews()
                ]);

                if (bookingsRes.success) setBookings(bookingsRes.data);
                else throw new Error(bookingsRes.message || "Could not fetch bookings.");

                if (reviewsRes.success) setReviews(reviewsRes.data);
                else throw new Error(reviewsRes.message || "Could not fetch reviews.");

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!isAuthenticated) {
        return <div className="text-center p-10">Please log in to view your dashboard.</div>;
    }

    if (loading) {
        return <div className="text-center p-10">Loading your dashboard...</div>;
    }

    const calendarEvents = bookings.map(b => ({
      title: b.itemId?.title || `${b.itemId?.brand} ${b.itemId?.model}`,
      start: b.startDate,
      end: b.endDate,
      backgroundColor: b.status === 'confirmed' ? '#10B981' : b.status === 'pending' ? '#F59E0B' : '#EF4444',
    }));

    const stats = {
        total: bookings.length,
        completed: bookings.filter(b => b.status === 'completed').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                    <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
                    <p className="text-lg text-gray-600 mt-2">Manage your bookings and reviews all in one place.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Bookings" value={stats.total} icon={BarChart2} />
                    <StatCard title="Upcoming Trips" value={stats.confirmed} icon={Car} />
                    <StatCard title="Pending Bookings" value={stats.pending} icon={Clock} />
                    <StatCard title="Completed Trips" value={stats.completed} icon={CheckCircle} />
                </div>

                <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg shadow-sm">
                    {['bookings', 'leave a review', 'my reviews', 'calendar'].map(tab => (
                       <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                           {tab}
                       </button>
                    ))}
                </div>

                <div className="bg-white p-6 rounded-b-lg shadow-md">
                   {activeTab === 'bookings' && <BookingsList bookings={bookings} />}
                   {activeTab === 'leave a review' && <LeaveReviewSection bookings={bookings} onReviewSubmit={fetchData} reviews={reviews} />}
                   {activeTab === 'my reviews' && <MyReviewsSection reviews={reviews} onUpdate={fetchData} />}
                   {activeTab === 'calendar' && <BookingCalendar events={calendarEvents} />}
                </div>
            </div>
        </div>
    );
};

// Sub-components
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

const BookingsList = ({ bookings }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
        <div className="space-y-4">
            {bookings.length > 0 ? bookings.map(booking => (
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
                </div>
            )) : <p>You have no bookings yet.</p>}
        </div>
    </div>
);

const LeaveReviewSection = ({ bookings, onReviewSubmit, reviews }) => {
    const [selectedBookingId, setSelectedBookingId] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const handleSubmit = async () => {
        const reviewData = {
            bookingId: selectedBookingId,
            rating,
            comment,
            isAnonymous,
        };
        const response = await DataService.submitFeedback(reviewData);
        if (response.success) {
            alert('Thank you for your feedback!');
            onReviewSubmit();
        } else {
            alert('Failed to submit feedback: ' + response.message);
        }
    };
    
    const reviewedBookingIds = new Set(reviews.map(r => r.booking));
    const completetedBookings = bookings.filter(b => b.status === 'completed' && !reviewedBookingIds.has(b._id));

    return (
         <div>
            <h2 className="text-2xl font-bold mb-4">Leave a Review</h2>
            {completetedBookings.length > 0 ? (
                <div className="space-y-4">
                    <select onChange={(e) => setSelectedBookingId(e.target.value)} className="p-2 border rounded w-full">
                        <option value="">Select a completed booking to review</option>
                        {completetedBookings.map(b => (
                            <option key={b._id} value={b._id}>{b.itemId?.title || `${b.itemId?.brand} ${b.itemId?.model}`}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} onClick={() => setRating(star)} className={`cursor-pointer w-6 h-6 ${rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                    </div>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="p-2 border rounded w-full" rows="4" placeholder="Share your experience..."></textarea>
                    <div className="flex items-center">
                        <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                        <label htmlFor="anonymous" className="ml-2 text-sm">Post as anonymous</label>
                    </div>
                    <button onClick={handleSubmit} disabled={!selectedBookingId || rating === 0 || !comment} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400">Submit Review</button>
                </div>
            ) : <p>You have no completed bookings to review.</p>}
        </div>
    );
};

const MyReviewsSection = ({ reviews, onUpdate }) => {
    const handleDelete = async (reviewId) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            await DataService.deleteReview(reviewId);
            onUpdate();
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">My Reviews</h2>
            <div className="space-y-4">
                {reviews.length > 0 ? reviews.map(review => (
                    <div key={review._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold">{review.item?.title || `${review.item?.brand} ${review.item?.model}`}</p>
                                <div className="flex items-center gap-1 my-1">
                                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                                </div>
                                <p className="text-gray-700">{review.comment}</p>
                            </div>
                            <div>
                                <button onClick={() => handleDelete(review._id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                )) : <p>You have not submitted any reviews yet.</p>}
            </div>
        </div>
    );
};

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


export default CustomerDashboard;