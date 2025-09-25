import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  DollarSign, 
  Users, 
  Car, 
  MapPin,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';
import DataService from '../../components/services/DataService.jsx';
import { useSocket } from '../../hooks/useSocket';

const Reports = () => {
  const { addNotification } = useSocket();
  const [reportData, setReportData] = useState({
    revenue: {
      daily: [],
      weekly: [],
      monthly: []
    },
    bookings: {
      total: 0,
      accepted: 0,
      pending: 0,
      rejected: 0,
      by_type: { car: 0, tour: 0 }
    },
    popular: {
      cars: [],
      tours: [],
      destinations: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    console.log('📊 Reports component initialized by BlueDrinkingWater at 2025-09-01 16:36:06');
    fetchReportData();
  }, [selectedPeriod, dateRange]);

// Fix the fetchReportData function around line 52
const fetchReportData = async () => {
  try {
    setLoading(true);
    console.log(`📈 Fetching ${selectedPeriod} reports by BlueDrinkingWater at 2025-09-01 16:36:06`);

    // Fetch all necessary data with better error handling
    let allBookings = [];
    let allCars = [];
    let allTours = [];

    try {
      const bookingsResponse = await DataService.fetchAllBookings();
      if (bookingsResponse && Array.isArray(bookingsResponse.data)) {
        allBookings = bookingsResponse.data;
      } else if (Array.isArray(bookingsResponse)) {
        allBookings = bookingsResponse;
      }
    } catch (error) {
      console.log('Failed to fetch bookings:', error);
    }

    try {
      const carsResponse = await DataService.fetchAllCars();
      if (carsResponse && Array.isArray(carsResponse.data)) {
        allCars = carsResponse.data;
      } else if (Array.isArray(carsResponse)) {
        allCars = carsResponse;
      }
    } catch (error) {
      console.log('Failed to fetch cars:', error);
    }

    try {
      const toursResponse = await DataService.fetchAllTours();
      if (toursResponse && Array.isArray(toursResponse.data)) {
        allTours = toursResponse.data;
      } else if (Array.isArray(toursResponse)) {
        allTours = toursResponse;
      }
    } catch (error) {
      console.log('Failed to fetch tours:', error);
    }

    // Process revenue data
    const revenueData = {
      daily: generateMockRevenueData('daily'),
      weekly: generateMockRevenueData('weekly'),
      monthly: generateMockRevenueData('monthly')
    };

    // Process booking statistics - safely now
    const bookingStats = {
      total: allBookings.length,
      accepted: allBookings.filter(b => b && b.status === 'accepted').length,
      pending: allBookings.filter(b => b && b.status === 'pending').length,
      rejected: allBookings.filter(b => b && b.status === 'rejected').length,
      by_type: {
        car: allBookings.filter(b => b && b.itemType === 'car').length,
        tour: allBookings.filter(b => b && b.itemType === 'tour').length
      }
    };

    // Process popular items - safely
    const carBookings = allBookings.filter(b => b && b.itemType === 'car');
    const tourBookings = allBookings.filter(b => b && b.itemType === 'tour');

    const popularCars = allCars.slice(0, 5).map(car => ({
      ...car,
      bookingCount: Math.floor(Math.random() * 20) + 5
    }));

    const popularTours = allTours.slice(0, 5).map(tour => ({
      ...tour,
      bookingCount: Math.floor(Math.random() * 15) + 3
    }));

    setReportData({
      revenue: revenueData,
      bookings: bookingStats,
      popular: {
        cars: popularCars,
        tours: popularTours,
        destinations: generatePopularDestinations()
      }
    });

    console.log('✅ Reports data loaded successfully at 2025-09-01 16:36:06');
  } catch (error) {
    console.error('❌ Error fetching reports data at 2025-09-01 16:36:06:', error);
    addNotification && addNotification('Failed to load reports data', 'error');
  } finally {
    setLoading(false);
  }
};

  const generateMockRevenueData = (period) => {
    const data = [];
    const today = new Date();
    
    if (period === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 50000) + 10000,
          bookings: Math.floor(Math.random() * 20) + 5
        });
      }
    } else if (period === 'weekly') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        data.push({
          date: `Week of ${date.toISOString().split('T')[0]}`,
          revenue: Math.floor(Math.random() * 200000) + 50000,
          bookings: Math.floor(Math.random() * 80) + 20
        });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.floor(Math.random() * 500000) + 100000,
          bookings: Math.floor(Math.random() * 200) + 50
        });
      }
    }
    
    return data;
  };

  const generatePopularDestinations = () => {
    return [
      { name: 'Boracay', bookings: 45, revenue: 450000 },
      { name: 'Palawan', bookings: 38, revenue: 520000 },
      { name: 'Cebu', bookings: 32, revenue: 380000 },
      { name: 'Bohol', bookings: 28, revenue: 310000 },
      { name: 'Siargao', bookings: 22, revenue: 290000 }
    ];
  };

  const exportReport = async (format) => {
    try {
      console.log(`📄 Exporting ${format} report by BlueDrinkingWater at 2025-09-01 16:36:06`);
      
      // Create report data
      const reportContent = {
        title: `DoRayd Travel & Tours - ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Report`,
        generatedBy: 'BlueDrinkingWater',
        generatedAt: '2025-09-01 16:36:06',
        period: selectedPeriod,
        dateRange: dateRange,
        data: reportData
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dorayd-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const csvData = reportData.revenue[selectedPeriod].map(item => 
          `${item.date},${item.revenue},${item.bookings}`
        ).join('\n');
        const csvContent = `Date,Revenue,Bookings\n${csvData}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dorayd-revenue-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      addNotification(`Report exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('❌ Export error at 2025-09-01 16:36:06:', error);
      addNotification('Failed to export report', 'error');
    }
  };

  const totalRevenue = reportData.revenue[selectedPeriod].reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = reportData.revenue[selectedPeriod].reduce((sum, item) => sum + item.bookings, 0);
  const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => exportReport('json')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+12.5% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.bookings.total}</p>
              <p className="text-sm text-blue-600">{reportData.bookings.accepted} accepted</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Revenue/Booking</p>
              <p className="text-2xl font-bold text-gray-900">₱{Math.round(avgRevenuePerBooking).toLocaleString()}</p>
              <p className="text-sm text-purple-600">+8.3% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.bookings.total > 0 
                  ? Math.round((reportData.bookings.accepted / reportData.bookings.total) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-orange-600">+5.2% from last period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="w-4 h-4" />
            <span>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} View</span>
          </div>
        </div>
        
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Revenue chart visualization</p>
            <p className="text-sm text-gray-500">Chart component integration needed</p>
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Cars */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Most Booked Cars
          </h3>
          <div className="space-y-3">
            {reportData.popular.cars.length > 0 ? (
              reportData.popular.cars.map((car, index) => (
                <div key={car._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{car.brand} {car.model}</p>
                      <p className="text-sm text-gray-600">{car.bookingCount} bookings</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">₱{car.pricePerDay?.toLocaleString()}/day</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No car bookings yet</p>
            )}
          </div>
        </div>

        {/* Popular Tours */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Most Booked Tours
          </h3>
          <div className="space-y-3">
            {reportData.popular.tours.length > 0 ? (
              reportData.popular.tours.map((tour, index) => (
                <div key={tour._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tour.title}</p>
                      <p className="text-sm text-gray-600">{tour.bookingCount} bookings</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">₱{tour.price?.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No tour bookings yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-blue-600">{reportData.bookings.total}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Total</p>
            <p className="text-xs text-gray-600">All bookings</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-green-600">{reportData.bookings.accepted}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Accepted</p>
            <p className="text-xs text-gray-600">Confirmed bookings</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-yellow-600">{reportData.bookings.pending}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Pending</p>
            <p className="text-xs text-gray-600">Awaiting approval</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-red-600">{reportData.bookings.rejected}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Rejected</p>
            <p className="text-xs text-gray-600">Declined bookings</p>
          </div>
        </div>
      </div>

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Development Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Generated by:</strong> BlueDrinkingWater</p>
              <p><strong>Timestamp:</strong> 2025-09-01 16:36:06</p>
              <p><strong>Period:</strong> {selectedPeriod}</p>
            </div>
            <div>
              <p><strong>Date Range:</strong> {dateRange.start} to {dateRange.end}</p>
              <p><strong>Total Records:</strong> {reportData.bookings.total}</p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;