import React, { useState, useEffect } from 'react';
import { Search, Filter, Car, MapPin, Users, Calendar, Star, Clock, ChevronLeft, ChevronRight, Grid, List, X, ArrowDown, ArrowUp, RefreshCw, AlertCircle } from 'lucide-react';
import BookingModal from '../../components/BookingModal';
import DataService from '../../components/services/DataService';
import { useAuth } from '../../components/Login.jsx';

const DashboardLayout = ({ children, userRole }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Add the missing hasPermission function
  const hasPermission = (user, permission) => {
    if (!user || !permission) return true; // Default to true if no permission check needed
    if (user.role === 'admin') return true; // Admin has all permissions
    
    // Check if user has specific permission
    return user.permissions?.some(p => 
      p.module === permission || p.access === 'full'
    ) || false;
  };

  const getMenuItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: `/${userRole}/dashboard`, icon: 'home' }
    ];

    if (userRole === 'admin') {
      return [
        ...baseItems,
        { name: 'Manage Services', href: '/owner/manage-services', icon: 'services' },
        { name: 'Bookings', href: '/owner/manage-bookings', icon: 'calendar' },
        { name: 'Employee Management', href: '/owner/employee-management', icon: 'users' },
        { name: 'Content Management', href: '/owner/content-management', icon: 'edit' },
        { name: 'Reports', href: '/owner/reports', icon: 'chart' },
        { name: 'Messages', href: '/owner/messages', icon: 'message' }
      ];
    } else if (userRole === 'employee') {
      return [
        ...baseItems,
        { name: 'Bookings', href: '/employee/bookings', icon: 'calendar', permission: 'bookings' },
        { name: 'Services', href: '/employee/services', icon: 'services', permission: 'services' },
        { name: 'Content', href: '/employee/content', icon: 'edit', permission: 'content' }
      ].filter(item => !item.permission || hasPermission(user, item.permission));
    }

    return baseItems;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300`}>
        <div className="p-4">
          <h2 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>
            {userRole === 'admin' ? 'Admin Panel' : 'Employee Panel'}
          </h2>
        </div>
        <nav className="mt-8">
          {getMenuItems().map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 hover:bg-blue-50 transition-colors"
            >
              <span className="mr-3">{item.icon}</span>
              <span className={!sidebarOpen ? 'hidden' : 'block'}>{item.name}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              ☰
            </button>
            <div className="flex items-center space-x-4">
              <span>Welcome, {user?.firstName || 'User'}</span>
              <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const CustomerDashboard = ({ initialTab = 'all' }) => {
  console.log('🎯 Customer Dashboard loading at 2025-09-12 16:39:10');
  console.log('👤 Current User: BlueDrinkingWater');
  console.log('🔧 Initial Tab:', initialTab);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    priceMin: '',
    priceMax: '',
    sortBy: 'featured'
  });

  const [cars, setCars] = useState([]);
  const [tours, setTours] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalCars: 0,
    totalTours: 0,
    totalItems: 0
  });

  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch data from database
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Fetching customer dashboard data from database at 2025-09-12 16:39:10`);

      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      let carsData = [];
      let toursData = [];

      if (activeTab === 'all' || activeTab === 'cars') {
        const carsResponse = await DataService.fetchAllCars(queryParams);
        if (carsResponse.success) {
          carsData = carsResponse.data || [];
          setPagination(prev => ({ ...prev, totalCars: carsResponse.pagination?.total || 0 }));
        }
      }

      if (activeTab === 'all' || activeTab === 'tours') {
        const toursResponse = await DataService.fetchAllTours(queryParams);
        if (toursResponse.success) {
          toursData = toursResponse.data || [];
          setPagination(prev => ({ ...prev, totalTours: toursResponse.pagination?.total || 0 }));
        }
      }

      setCars(carsData);
      setTours(toursData);

      // Combine and sort all items for 'all' tab
      if (activeTab === 'all') {
        const combined = [
          ...carsData.map(car => ({ ...car, type: 'car' })),
          ...toursData.map(tour => ({ ...tour, type: 'tour' }))
        ];
        
        // Sort combined items
        const sorted = sortItems(combined, filters.sortBy);
        setAllItems(sorted);
        setPagination(prev => ({ ...prev, totalItems: combined.length }));
      }

      console.log(`✅ Dashboard data loaded: ${carsData.length} cars, ${toursData.length} tours at 2025-09-12 16:39:10`);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.message);
      setCars([]);
      setTours([]);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, pagination.page, searchTerm, filters]);

  const sortItems = (items, sortBy) => {
    const sorted = [...items];
    
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => {
          const priceA = a.type === 'car' ? a.pricePerDay : a.price;
          const priceB = b.type === 'car' ? b.pricePerDay : b.price;
          return priceA - priceB;
        });
      case 'price_high':
        return sorted.sort((a, b) => {
          const priceA = a.type === 'car' ? a.pricePerDay : a.price;
          const priceB = b.type === 'car' ? b.pricePerDay : b.price;
          return priceB - priceA;
        });
      case 'rating':
        return sorted.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
      case 'featured':
      default:
        return sorted.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilters(false);
    fetchData();
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      priceMin: '',
      priceMax: '',
      sortBy: 'featured'
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleBookItem = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type || item.type);
    setShowBookingModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const renderItemCard = (item, type) => {
    const itemType = type || item.type;
    const isCarItem = itemType === 'car';
    const price = isCarItem ? item.pricePerDay : item.price;
    const priceLabel = isCarItem ? '/day' : '/person';

    return (
      <div key={`${itemType}-${item._id}`} className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
        viewMode === 'list' ? 'flex' : ''
      }`}>
        <div className={`${viewMode === 'list' ? 'w-80 h-48' : 'h-48'} bg-gray-200 overflow-hidden relative`}>
          {item.images && item.images.length > 0 ? (
            <img
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.images[0]}`}
              alt={isCarItem ? `${item.brand} ${item.model}` : item.title || item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/api/placeholder/400/300';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              {isCarItem ? <Car className="w-12 h-12 text-gray-500" /> : <MapPin className="w-12 h-12 text-gray-500" />}
            </div>
          )}
          
          {item.featured && (
            <div className={`absolute top-2 left-2 ${isCarItem ? 'bg-blue-600' : 'bg-green-600'} text-white px-2 py-1 rounded text-xs font-semibold`}>
              Featured
            </div>
          )}
          
          <div className={`absolute top-2 right-2 ${isCarItem ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} px-2 py-1 rounded text-xs font-semibold`}>
            {isCarItem ? 'Car' : 'Tour'}
          </div>
          
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-red-600 text-white px-3 py-1 rounded font-semibold">
                Not Available
              </div>
            </div>
          )}
        </div>
        
        <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isCarItem ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'} px-2 py-1 rounded`}>
              {isCarItem ? `${item.seats} Seats` : item.duration}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-600">
                {item.ratings?.average || 'N/A'} ({item.ratings?.count || 0})
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isCarItem ? `${item.brand} ${item.model}` : item.title || item.name}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-2">
            {item.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-2xl font-bold ${isCarItem ? 'text-blue-600' : 'text-green-600'}`}>
                {formatPrice(price)}
              </span>
              <span className="text-gray-500">{priceLabel}</span>
            </div>
            <button
              onClick={() => handleBookItem(item, itemType)}
              disabled={!item.isAvailable}
              className={`${isCarItem ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors`}
            >
              {item.isAvailable ? 'Book Now' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (error) {
      return (
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Data</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </div>
      );
    }

    const hasFilters = searchTerm || Object.values(filters).some(value => value !== '' && value !== 'featured');

    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          {activeTab === 'cars' ? <Car className="w-8 h-8 text-gray-400" /> : 
           activeTab === 'tours' ? <MapPin className="w-8 h-8 text-gray-400" /> :
           <Search className="w-8 h-8 text-gray-400" />}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          No {activeTab === 'all' ? 'Items' : activeTab === 'cars' ? 'Cars' : 'Tours'} Available
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {hasFilters 
            ? 'No items match your current search and filters. Try adjusting your criteria.'
            : `${activeTab === 'cars' ? 'Cars' : activeTab === 'tours' ? 'Tours' : 'Items'} will appear here once added by our admin team.`
          }
        </p>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Clear Search & Filters
          </button>
        )}
      </div>
    );
  };

  const getDisplayItems = () => {
    switch (activeTab) {
      case 'cars':
        return cars;
      case 'tours':
        return tours;
      case 'all':
      default:
        return allItems;
    }
  };

  const displayItems = getDisplayItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Services</h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading from database...' : 
                 error ? 'Unable to load data' :
                 `Discover our ${activeTab === 'all' ? 'cars and tours' : activeTab}`}
              </p>
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search cars, tours, destinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs and Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All Services', count: pagination.totalItems },
              { key: 'cars', label: 'Cars', count: pagination.totalCars },
              { key: 'tours', label: 'Tours', count: pagination.totalTours }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label} {!loading && tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter & Sort</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="City or area"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₱)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₱)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="featured">Featured First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear All
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading from Database</h3>
            <p className="text-gray-600">Fetching available services...</p>
          </div>
        ) : displayItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {displayItems.length} {activeTab === 'all' ? 'services' : activeTab}
                {(searchTerm || Object.values(filters).some(value => value !== '' && value !== 'featured')) && ' (filtered)'}
              </p>
            </div>

            {/* Items Grid/List */}
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-6'
            }`}>
              {displayItems.map((item) => renderItemCard(item, item.type))}
            </div>
          </>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedItem && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedItem(null);
            setSelectedItemType(null);
          }}
          item={selectedItem}
          itemType={selectedItemType}
        />
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border-t border-gray-300 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-xs text-gray-600">
              <p>🔧 Development Mode - Customer Dashboard</p>
              <p>Database Status: {error ? 'Error' : loading ? 'Loading' : 'Connected'}</p>
              <p>Active Tab: {activeTab} | Items: {displayItems.length}</p>
              <p>Time: 2025-09-12 16:39:10 | User: BlueDrinkingWater</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;