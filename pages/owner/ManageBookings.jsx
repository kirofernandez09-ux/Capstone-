import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, XCircle } from 'lucide-react';
import DataService from '../../components/services/DataService.jsx';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await DataService.fetchAllBookings();
      setBookings(response.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedBooking) return;
    setIsUpdating(true);
    try {
      await DataService.updateBookingStatus(selectedBooking._id, newStatus, adminNotes);
      setSelectedBooking(null); // Close modal
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error("Failed to update booking status:", error);
      alert("Error updating status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${booking.firstName} ${booking.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>{status}</span>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Bookings</h2>
      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 border rounded">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking._id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{booking.bookingReference}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{booking.firstName} {booking.lastName}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{booking.itemType}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(booking.startDate).toLocaleDateString()}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">₱{booking.totalPrice.toLocaleString()}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><StatusBadge status={booking.status} /></td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                    <button onClick={() => { setSelectedBooking(booking); setAdminNotes(''); }} className="text-blue-600 hover:text-blue-900"><Eye /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)}><XCircle /></button>
            </div>
            {/* Display booking details here */}
            <p><strong>Reference:</strong> {selectedBooking.bookingReference}</p>
            <p><strong>Customer:</strong> {selectedBooking.firstName} {selectedBooking.lastName}</p>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Admin Notes (optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows="3"
                className="w-full p-2 border rounded mt-1"
                placeholder="Add notes for the customer (e.g., reason for rejection)"
              ></textarea>
            </div>

            {selectedBooking.status === 'pending' && (
              <div className="flex justify-end space-x-4 mt-6">
                <button onClick={() => handleStatusUpdate('rejected')} disabled={isUpdating} className="px-4 py-2 bg-red-500 text-white rounded flex items-center">
                  <X size={18} className="mr-2"/> Reject
                </button>
                <button onClick={() => handleStatusUpdate('confirmed')} disabled={isUpdating} className="px-4 py-2 bg-green-500 text-white rounded flex items-center">
                  <Check size={18} className="mr-2"/> Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;