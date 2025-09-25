import React, { useState, useEffect } from 'react';
import { BarChart3, Download, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import DataService from '../../components/services/DataService.jsx';

const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await DataService.fetchDashboardAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    if (!analytics) return;
    const dataStr = JSON.stringify(analytics, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return <div className="text-center p-10">Loading reports...</div>;
  }
  
  if (!analytics) {
      return <div className="text-center p-10 text-red-500">Could not load report data.</div>
  }

  const { summary, recentBookings } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <div className="flex space-x-2">
            <button onClick={fetchReportData} className="bg-gray-200 px-4 py-2 rounded-lg flex items-center"><RefreshCw size={16} className="mr-2"/> Refresh</button>
            <button onClick={() => exportReport('json')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"><Download size={16} className="mr-2"/> Export JSON</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Bookings</h3>
              <p className="text-2xl font-bold">{summary.totalBookings}</p>
          </div>
           <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Pending Bookings</h3>
              <p className="text-2xl font-bold">{summary.pendingBookings}</p>
          </div>
           <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Cars</h3>
              <p className="text-2xl font-bold">{summary.totalCars}</p>
          </div>
           <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Tours</h3>
              <p className="text-2xl font-bold">{summary.totalTours}</p>
          </div>
      </div>

      {/* Recent Bookings List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
        <div className="space-y-4">
            {recentBookings.length > 0 ? recentBookings.map(booking => (
                <div key={booking._id} className="flex justify-between items-center border-b pb-2">
                    <div>
                        <p className="font-medium">{booking.bookingReference}</p>
                        <p className="text-sm text-gray-500">{booking.firstName} {booking.lastName}</p>
                    </div>
                    <p className="font-semibold">₱{booking.totalPrice.toLocaleString()}</p>
                </div>
            )) : <p>No recent bookings.</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;