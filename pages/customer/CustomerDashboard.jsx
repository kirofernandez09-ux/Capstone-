import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../components/Login.jsx';
import DataService from '../../components/services/DataService.jsx';
import { Upload, Car, MapPin, X, CheckCircle, Clock, AlertCircle, Eye, FileUp, Building, User as UserIcon } from 'lucide-react';

const CustomerDashboard = () => {
    const { user, isAuthenticated } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [paymentProofFile, setPaymentProofFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const fetchBookings = useCallback(async () => {
        if (isAuthenticated) {
            setLoading(true);
            setError(null);
            try {
                const response = await DataService.fetchAllBookings();
                if (response.success) {
                    setBookings(response.data);
                } else {
                    throw new Error(response.message || "Could not fetch bookings.");
                }
            } catch (err) {
                setError(err.message);
                console.error(err);
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

    const handleFileUpload = async () => {
        if (!paymentProofFile || !selectedBooking) return;
        setIsUploading(true);
        try {
            // NOTE: The DataService needs a method for this. Assuming `uploadPaymentProof(bookingId, file)`
            const response = await DataService.uploadPaymentProof(selectedBooking._id, paymentProofFile);
            if(response.success) {
                alert('Upload successful! Our team will review it shortly.');
                setSelectedBooking(null);
                setPaymentProofFile(null);
                fetchBookings();
            } else {
                throw new Error(response.message || 'Upload failed.');
            }
        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };


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
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 ${styles[status] || styles.pending}`}>
                <Icon size={14} /> {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }


    if (!isAuthenticated) {
        return <div className="text-center p-10">Please log in to view your dashboard.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">My Dashboard</h1>
                    <p className="text-lg text-gray-600 mt-2">Welcome back, {user?.firstName}! Here are your bookings.</p>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>All Bookings</button>
                    <button onClick={() => setActiveTab('car')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'car' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Car Rentals</button>
                    <button onClick={() => setActiveTab('tour')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'tour' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Tour Packages</button>
                </div>

                {loading ? <div className="text-center p-10">Loading your bookings...</div> : 
                 error ? <div className="text-center p-10 text-red-500">{error}</div> : (
                    <div className="space-y-6">
                        {filteredBookings.length > 0 ? filteredBookings.map(booking => (
                            <div key={booking._id} className="bg-white p-5 rounded-xl shadow-md border border-gray-200 transition-shadow hover:shadow-lg">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${booking.itemType === 'car' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                            {booking.itemType === 'car' ? <Car className="w-6 h-6 text-blue-600"/> : <MapPin className="w-6 h-6 text-green-600"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{booking.itemId?.title || `${booking.itemId?.brand} ${booking.itemId?.model}` || 'Service Details Unavailable'}</p>
                                            <p className="text-sm text-gray-500 font-mono">{booking.bookingReference}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="text-sm">
                                            <p className="font-semibold text-gray-500">Date</p>
                                            <p className="text-gray-800">{formatDate(booking.startDate)}</p>
                                        </div>
                                        <div className="font-bold text-lg text-gray-800">₱{booking.totalPrice.toLocaleString()}</div>
                                        <div><StatusBadge status={booking.status} /></div>
                                        <button onClick={() => setSelectedBooking(booking)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors">
                                            <Eye size={20}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                                <p className="text-lg font-medium text-gray-700">No {activeTab !== 'all' ? activeTab : ''} bookings found.</p>
                                <p className="text-gray-500 mt-2">Ready for an adventure? Book a service to see it here!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Booking Details & Upload Modal */}
                {selectedBooking && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity">
                        <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
                                    <p className="text-gray-500 font-mono">{selectedBooking.bookingReference}</p>
                                </div>
                                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600"><X /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-semibold text-gray-500 text-sm mb-2">CUSTOMER</h4>
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-800">{selectedBooking.firstName} {selectedBooking.lastName}</span>
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-gray-500 text-sm mb-2">SERVICE</h4>
                                    <div className="flex items-center gap-3">
                                        <Building className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-800">{selectedBooking.itemId?.title || `${selectedBooking.itemId?.brand} ${selectedBooking.itemId?.model}`}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <h4 className="font-semibold text-gray-500 text-sm mb-3">ADMIN NOTES</h4>
                                <p className="text-gray-700 italic">
                                    {selectedBooking.adminNotes || "No notes from the admin for this booking."}
                                </p>
                            </div>
                            
                            {selectedBooking.status === 'pending' && (
                                <div className="border-t pt-6">
                                    <h4 className="font-semibold text-gray-800 mb-3">Action Required: Upload Payment Proof</h4>
                                    <p className="text-sm text-gray-600 mb-4">To confirm your booking, please upload a clear image of your payment receipt (e.g., screenshot of GCash transaction, bank transfer confirmation).</p>
                                    
                                    <input type="file" ref={fileInputRef} onChange={(e) => setPaymentProofFile(e.target.files[0])} className="hidden" accept="image/png, image/jpeg, image/jpg"/>
                                    
                                    <div className="flex items-center gap-4">
                                        <button onClick={handleFileSelect} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors">
                                            <FileUp size={16} /> Choose File
                                        </button>
                                        {paymentProofFile && <span className="text-sm text-gray-700 truncate">{paymentProofFile.name}</span>}
                                    </div>

                                    <button onClick={handleFileUpload} disabled={!paymentProofFile || isUploading} className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed">
                                        {isUploading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} /> Submit Payment Proof
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {selectedBooking.paymentProof?.url && (
                                <div className="border-t pt-6">
                                     <h4 className="font-semibold text-gray-800 mb-3">Payment Proof Submitted</h4>
                                     <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">Our team is reviewing your payment. You will be notified once it's confirmed.</p>
                                     <a href={selectedBooking.paymentProof.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mt-2 inline-block hover:underline">View Uploaded File</a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDashboard;