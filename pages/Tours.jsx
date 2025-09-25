import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Users, Star, Calendar, Clock, Grid, List, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import DataService from '../components/services/DataService';

const Tours = () => {
  console.log('🗺️ Tours page loading at 2025-09-03 15:25:11');
  console.log('👤 Current User: BlueDrinkingWater');

  const location = useLocation();
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    destination: '',
    minPrice: '',
    maxPrice: '',
    duration: '',
    difficulty: '',
    maxGroupSize: ''
  });

  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Initialize from location state if available
  useEffect(() => {
    const state = location.state;
    if (state) {
      if (state.location) {
        setFilters(prev => ({ ...prev, destination: state.location }));
      }
      if (state.selectedTour) {
        // Will be handled after tours are loaded
      }
    }
  }, [location.state]);

  // Fetch tours from database
  const fetchTours = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Fetching tours from database (page ${page}) at 2025-09-03 15:25:11`);

      const queryParams = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(newFilters).filter(([_, value]) => value !== '')
        )
      };

      const response = await DataService.fetchAllTours(queryParams);

      if (response.success) {
        setTours(response.data || []);
        setPagination(prev => ({
          ...prev,
          page: response.pagination?.currentPage || page,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));

        console.log(`✅ Loaded ${response.data?.length || 0} tours from database at 2025-09-03 15:25:11`);

        // Handle selectedTour from location state
        if (location.state?.selectedTour && response.data) {
          const tour = response.data.find(t => t._id === location.state.selectedTour);
          if (tour) {
            setSelectedTour(tour);
            setShowBookingModal(true);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to load tours from database');
      }
    } catch (error) {
      console.error('❌ Error fetching tours from database:', error);
      setError(error.message);
      setTours([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours(1, filters);
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    fetchTours(1, filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      destination: '',
      minPrice: '',
      maxPrice: '',
      duration: '',
      difficulty: '',
      maxGroupSize: ''
    };
    setFilters(clearedFilters);
    fetchTours(1, clearedFilters);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTours(newPage, filters);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBookTour = (tour) => {
    setSelectedTour(tour);
    setShowBookingModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTourCard = (tour) => (
    <div key={tour._id} className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      <div className={`${viewMode === 'list' ? 'w-80 h-48' : 'h-48'} bg-gray-200 overflow-hidden relative`}>
        {tour.images && tour.images.length > 0 ? (
          <img
            src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${tour.images[0]}`}
            alt={tour.title || tour.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/api/placeholder/400/300';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <MapPin className="w-12 h-12 text-gray-500" />
          </div>
        )}
        
        {tour.featured && (
          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
            Featured
          </div>
        )}
        
        {!tour.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-red-600 text-white px-3 py-1 rounded font-semibold">
              Not Available
            </div>
          </div>
        )}
      </div>
      
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium px-2 py-1 rounded ${getDifficultyColor(tour.difficulty)}`}>
            {tour.difficulty || 'Easy'}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm text-gray-600">
              {tour.ratings?.average || 'N/A'} ({tour.ratings?.count || 0})
            </span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {tour.title || tour.name}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {tour.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{tour.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{tour.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Max {tour.maxGroupSize} people</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className="capitalize">{tour.difficulty || 'Easy'}</span>
          </div>
        </div>

        {/* Inclusions preview */}
        {tour.inclusions && tour.inclusions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Includes:</h4>
            <div className="flex flex-wrap gap-1">
              {tour.inclusions.slice(0, 3).map((inclusion, index) => (
                <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {inclusion}
                </span>
              ))}
              {tour.inclusions.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{tour.inclusions.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(tour.price)}
            </span>
            <span className="text-gray-500">/person</span>
          </div>
          <button
            onClick={() => handleBookTour(tour)}
            disabled={!tour.isAvailable}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {tour.isAvailable ? 'Book Now' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => {
    if (error) {
      return (
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Tours</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => fetchTours(1, filters)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Loading
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-16">
        <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Tours Available</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {Object.values(filters).some(value => value !== '') 
            ? 'No tours match your current filters. Try adjusting your search criteria.'
            : 'Tour packages will appear here once added by our admin team.'
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {Object.values(filters).some(value => value !== '') && (
            <button
              onClick={clearFilters}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Other Services
          </button>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 rounded-lg font-medium ${
              page === pagination.page
                ? 'bg-green-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tour Packages</h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading tours from database...' : 
                 error ? 'Unable to load tours' :
                 `${pagination.total} amazing destinations available`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Tours</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Tour name or keyword"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  placeholder="City or province"
                  value={filters.destination}
                  onChange={(e) => handleFilterChange('destination', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => handleFilterChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any Duration</option>
                  <option value="1 day">1 Day</option>
                  <option value="2 days">2 Days</option>
                  <option value="3 days">3 Days</option>
                  <option value="4 days">4 Days</option>
                  <option value="5 days">5+ Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any Level</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="challenging">Challenging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size</label>
                <select
                  value={filters.maxGroupSize}
                  onChange={(e) => handleFilterChange('maxGroupSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any Size</option>
                  <option value="5">Up to 5 people</option>
                  <option value="10">Up to 10 people</option>
                  <option value="15">Up to 15 people</option>
                  <option value="20">20+ people</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₱/person)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₱/person)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear All Filters
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
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Tours from Database</h3>
            <p className="text-gray-600">Fetching amazing destinations...</p>
          </div>
        ) : tours.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <p className="text-gray-600">
                Showing {tours.length} of {pagination.total} tours
                {Object.values(filters).some(value => value !== '') && ' (filtered)'}
              </p>
              <p className="text-sm text-gray-500 mt-2 sm:mt-0">
                Page {pagination.page} of {pagination.totalPages}
              </p>
            </div>

            {/* Tours Grid/List */}
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-6'
            }`}>
              {tours.map(renderTourCard)}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedTour && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTour(null);
          }}
          item={selectedTour}
          itemType="tour"
        />
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border-t border-gray-300 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-xs text-gray-600">
              <p>🔧 Development Mode - Tours Page</p>
              <p>Database Status: {error ? 'Error' : loading ? 'Loading' : 'Connected'}</p>
              <p>Tours Loaded: {tours.length} | Total in DB: {pagination.total}</p>
              <p>Time: 2025-09-03 15:25:11 | User: BlueDrinkingWater</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tours;