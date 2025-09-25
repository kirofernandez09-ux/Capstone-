import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import DataService from '../components/services/DataService';

const Tours = () => {
  const location = useLocation();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0 });
  const [filters, setFilters] = useState({ destination: '', minPrice: '', maxPrice: '' });
  const [selectedTour, setSelectedTour] = useState(null);

  useEffect(() => {
    if (location.state?.selectedItem) {
        setSelectedTour(location.state.selectedItem);
    }
    fetchTours(1, filters);
  }, []);

  const fetchTours = async (page, currentFilters) => {
    setLoading(true);
    try {
      const response = await DataService.fetchAllTours({ ...currentFilters, page, limit: pagination.limit, archived: false, isAvailable: true });
      setTours(response.data);
      setPagination(prev => ({ ...prev, total: response.pagination.total, page }));
    } catch (error) {
      console.error("Failed to fetch tours:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleApplyFilters = () => fetchTours(1, filters);
  const handlePageChange = (newPage) => {
      if(newPage > 0 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
          fetchTours(newPage, filters);
      }
  };
  
  const TourCard = ({ tour }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img src={tour.images[0] || '/placeholder.png'} alt={tour.title} className="w-full h-48 object-cover"/>
        <div className="p-4">
            <h3 className="font-bold text-lg">{tour.title}</h3>
            <p className="text-gray-600 text-sm">{tour.destination}</p>
            <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-lg">₱{tour.price.toLocaleString()}/person</span>
                <button onClick={() => setSelectedTour(tour)} className="bg-green-600 text-white px-4 py-2 rounded-lg">Book Now</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Tour Packages</h1>
      {/* Filters */}
       <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center">
        <input name="destination" onChange={handleFilterChange} placeholder="Destination (e.g., Palawan)" className="p-2 border rounded"/>
        <input type="number" name="minPrice" onChange={handleFilterChange} placeholder="Min Price" className="p-2 border rounded"/>
        <input type="number" name="maxPrice" onChange={handleFilterChange} placeholder="Max Price" className="p-2 border rounded"/>
        <button onClick={handleApplyFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Apply</button>
      </div>

      {/* Results */}
       <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
           {loading ? <p>Loading...</p> : tours.map(tour => <TourCard key={tour._id} tour={tour} />)}
       </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-8">
        <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"><ChevronLeft/></button>
        <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
        <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"><ChevronRight/></button>
      </div>

      {selectedTour && (
        <BookingModal
          isOpen={!!selectedTour}
          onClose={() => setSelectedTour(null)}
          item={selectedTour}
          itemType="tour"
        />
      )}
    </div>
  );
};

export default Tours;