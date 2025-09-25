import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, Clock, Calendar, Users, MapPin, Phone, Mail, FileText, Upload, Download } from 'lucide-react';
import DataService from '../../components/services/DataService.jsx';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Bookings', color: 'text-gray-600' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-green-600' },
    { value: 'rejected', label: 'Rejected', color: 'text-red-600' },
    { value: 'completed', label: 'Completed', color: 'text-blue-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600' }
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await DataService.fetchAllBookings();
      
      // Ensure bookings is always an array
      if (response && Array.isArray(response.data)) {
        setBookings(response.data);
      } else if (Array.isArray(response)) {
        setBookings(response);
      } else {
        console.error('Unexpected response format:', response);
        setBookings([]); // Set to empty array if data format is unexpected
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to fetch bookings');
      setBookings([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdating(true);
    try {
      await DataService.updateBookingStatus(bookingId, newStatus, adminNotes);
      alert(`Booking ${newStatus} successfully!`);
      setShowModal(false);
      setSelectedBooking(null);
      setAdminNotes('');
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const viewBooking = (booking) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.adminNotes || '');
    setShowModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

 const filteredBookings = Array.isArray(bookings) 
    ? bookings.filter(booking => {
        const matchesSearch = 
          booking.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
        
        return matchesSearch && matchesFilter;
      })
    : [];


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600">Review and manage customer bookings</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Total: {bookings.length} bookings
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by booking reference, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {statusOptions.slice(1).map(status => {
          const count = bookings.filter(b => b.status === status.value).length;
          return (
            <div key={status.value} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  status.value === 'pending' ? 'bg-yellow-500' :
                  status.value === 'confirmed' ? 'bg-green-500' :
                  status.value === 'rejected' ? 'bg-red-500' :
                  status.value === 'completed' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.bookingReference}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.firstName} {booking.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {booking.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.bookingType === 'car' ? 
                            `${booking.car?.brand} ${booking.car?.model}` : 
                            booking.tour?.title
                          }
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}
                        </div>
                        {booking.pickupLocation && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {booking.pickupLocation}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.startDate)}
                        </div>
                        {booking.endDate && (
                          <div className="text-sm text-gray-500">
                            to {formatDate(booking.endDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(booking.totalPrice)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {booking.paymentMethod.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewBooking(booking)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No bookings have been made yet.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                  <p className="text-gray-600">{selectedBooking.bookingReference}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Booking Info */}
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedBooking.firstName} {selectedBooking.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedBooking.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedBooking.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{selectedBooking.bookingType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">
                          {selectedBooking.bookingType === 'car' ? 
                            `${selectedBooking.car?.brand} ${selectedBooking.car?.model}` : 
                            selectedBooking.tour?.title
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guests:</span>
                        <span className="font-medium">{selectedBooking.numberOfGuests}</span>
                      </div>
                      {selectedBooking.pickupLocation && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pickup:</span>
                          <span className="font-medium">{selectedBooking.pickupLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates and Pricing */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">{formatDate(selectedBooking.startDate)}</span>
                      </div>
                      {selectedBooking.endDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Date:</span>
                          <span className="font-medium">{formatDate(selectedBooking.endDate)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-lg text-blue-600">{formatPrice(selectedBooking.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium capitalize">{selectedBooking.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booking Date:</span>
                        <span className="font-medium">{formatDate(selectedBooking.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {selectedBooking.specialRequests && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Requests</h3>
                      <p className="text-sm text-gray-700">{selectedBooking.specialRequests}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Actions and Payment */}
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Status</h3>
                    <div className="flex items-center justify-center">
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>

                  {/* Payment Proof */}
                  {selectedBooking.paymentProof && selectedBooking.paymentProof.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Proof</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedBooking.paymentProof.map((proof, index) => (
                          <div key={index} className="relative">
                            {proof.endsWith('.pdf') ? (
                              <div className="bg-red-100 p-4 rounded-lg text-center">
                                <FileText className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                <p className="text-xs text-red-600">PDF Document</p>
                                <a
                                  href={`http://localhost:5000${proof}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                >
                                  View PDF
                                </a>
                              </div>
                            ) : proof.includes('video') || proof.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i) ? (
                              <video
                                src={`http://localhost:5000${proof}`}
                                controls
                                className="w-full h-20 object-cover rounded"
                              />
                            ) : (
                              <img
                                src={`http://localhost:5000${proof}`}
                                alt={`Payment proof ${index + 1}`}
                                className="w-full h-20 object-cover rounded cursor-pointer"
                                onClick={() => window.open(`http://localhost:5000${proof}`, '_blank')}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Notes</h3>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add notes about this booking..."
                    />
                  </div>

                  {/* Status Actions */}
                  {selectedBooking.status === 'pending' && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatusUpdate(selectedBooking._id, 'confirmed')}
                          disabled={updating}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedBooking._id, 'rejected')}
                          disabled={updating}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedBooking.status === 'confirmed' && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Mark as Complete</h3>
                      <button
                        onClick={() => handleStatusUpdate(selectedBooking._id, 'completed')}
                        disabled={updating}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    </div>
                  )}

                  {updating && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;