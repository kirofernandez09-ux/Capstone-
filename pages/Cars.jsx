import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import DataService from '../components/services/DataService';

const Cars = () => {
  const location = useLocation();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0 });
  const [filters, setFilters] = useState({ location: '', brand: '', minPrice: '', maxPrice: '' });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCar, setSelectedCar] = useState(null);

  useEffect(() => {
    if (location.state?.selectedItem) {
        setSelectedCar(location.state.selectedItem);
    }
    fetchCars(1, filters);
  }, []);

  const fetchCars = async (page, currentFilters) => {
    setLoading(true);
    try {
      const response = await DataService.fetchAllCars({ ...currentFilters, page, limit: pagination.limit, archived: false, isAvailable: true });
      setCars(response.data);
      if (response.pagination) {
        setPagination(prev => ({ ...prev, total: response.pagination.total, page }));
      }
    } catch (error) {
      console.error("Failed to fetch cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleApplyFilters = () => fetchCars(1, filters);
  const handlePageChange = (newPage) => {
      if(newPage > 0 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
          fetchCars(newPage, filters);
      }
  };

  const CarCard = ({ car }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img
          src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${car.images[0]}`}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
            <h3 className="font-bold text-lg">{car.brand} {car.model}</h3>
            <p className="text-gray-600 text-sm">{car.location}</p>
            <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-lg">₱{car.pricePerDay.toLocaleString()}/day</span>
                <button onClick={() => setSelectedCar(car)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Book Now</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Car Fleet</h1>
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-center">
        <input name="brand" onChange={handleFilterChange} placeholder="Brand (e.g., Toyota)" className="p-2 border rounded"/>
        <input name="location" onChange={handleFilterChange} placeholder="Location (e.g., Manila)" className="p-2 border rounded"/>
        <input type="number" name="minPrice" onChange={handleFilterChange} placeholder="Min Price" className="p-2 border rounded"/>
        <input type="number" name="maxPrice" onChange={handleFilterChange} placeholder="Max Price" className="p-2 border rounded"/>
        <button onClick={handleApplyFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Apply</button>
      </div>

       <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
           {loading ? <p>Loading...</p> : cars.map(car => <CarCard key={car._id} car={car} />)}
       </div>

      <div className="flex justify-center items-center mt-8">
        <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"><ChevronLeft/></button>
        <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}</span>
        <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"><ChevronRight/></button>
      </div>

      {selectedCar && (
        <BookingModal
          isOpen={!!selectedCar}
          onClose={() => setSelectedCar(null)}
          item={selectedCar}
          itemType="car"
        />
      )}
    </div>
  );
};

export default Cars;