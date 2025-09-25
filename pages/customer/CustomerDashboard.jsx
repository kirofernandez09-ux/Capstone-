import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/Login.jsx';
import DataService from '../../components/services/DataService.jsx';
import { Upload, Car, MapPin, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const CustomerDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (isAuthenticated) {
            setLoading(true);
            DataService.fetchAllBookings()
                .then(response => {
                    setBookings(response.data);
                })
                .catch(err => {
                    setError("Could not fetch your bookings.");
                    console.error(err);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const filteredBookings = bookings.filter(booking => {
        if (activeTab === 'all') return true;
        return booking.itemType === activeTab;
    });

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        const Icon = status === 'pending' ? Clock : status === 'confirmed' ? CheckCircle : AlertCircle;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${styles[status] || styles.pending}`}>
                <Icon size={14} /> {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (!isAuthenticated) {
        return <div className="text-center p-10">Please log in to view your dashboard.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-gray-600 mb-6">View your booking history and manage your trips.</p>
            
            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('all')} className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>All</button>
                <button onClick={() => setActiveTab('car')} className={`px-4 py-2 ${activeTab === 'car' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Car Rentals</button>
                <button onClick={() => setActiveTab('tour')} className={`px-4 py-2 ${activeTab === 'tour' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Tours</button>
            </div>

            {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : (
                <div className="space-y-4">
                    {filteredBookings.length > 0 ? filteredBookings.map(booking => (
                        <div key={booking._id} className="bg-white p-4 rounded-lg shadow-md flex flex-wrap justify-between items-center">
                            <div className="flex items-center gap-4">
                                {booking.itemType === 'car' ? <Car className="text-blue-500"/> : <MapPin className="text-green-500"/>}
                                <div>
                                    <p className="font-bold">{booking.bookingReference}</p>
                                    <p className="text-sm text-gray-600">{booking.itemId?.title || `${booking.itemId?.brand} ${booking.itemId?.model}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                <div className="text-sm">
                                    <p className="font-semibold">Booking Date</p>
                                    <p>{new Date(booking.startDate).toLocaleDateString()}</p>
                                </div>
                                <div><StatusBadge status={booking.status} /></div>
                                <div className="font-bold text-lg">₱{booking.totalPrice.toLocaleString()}</div>
                                <div>
                                    {booking.status === 'pending' && (
                                        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                                            <Upload size={14}/> Upload Proof
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>You have no {activeTab !== 'all' && activeTab} bookings yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;