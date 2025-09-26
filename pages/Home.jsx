import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, ArrowRight } from 'lucide-react';
import Hero from '../components/Hero.jsx';
import DataService from '../components/services/DataService.jsx';

const Home = () => {
  const navigate = useNavigate();
  const [featuredCars, setFeaturedCars] = useState([]);
  const [featuredTours, setFeaturedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [carsResponse, toursResponse] = await Promise.all([
          DataService.fetchAllCars({ limit: 3, featured: true, isAvailable: true }),
          DataService.fetchAllTours({ limit: 3, featured: true, isAvailable: true })
        ]);
        setFeaturedCars(carsResponse.data || []);
        setFeaturedTours(toursResponse.data || []);
      } catch (err) {
        setError("Could not load featured services. Please try again later.");
        console.error("Home page data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleBookNow = (item, type) => {
    navigate(`/${type}s`, { state: { selectedItem: item } });
  };

  const renderCarCard = (car) => (
    <div key={car._id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <img
        src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${car.images[0]}`}
        alt={`${car.brand} ${car.model}`}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{car.brand} {car.model}</h3>
        <p className="text-gray-600 text-sm">{car.location}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="font-bold text-lg">₱{(car.pricePerDay || 0).toLocaleString()}/day</span>
          <button onClick={() => handleBookNow(car, 'car')} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Book Now</button>
        </div>
      </div>
    </div>
  );

  const renderTourCard = (tour) => (
    <div key={tour._id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <img
        src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${tour.images[0]}`}
        alt={tour.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{tour.title}</h3>
        <p className="text-gray-600 text-sm">{tour.destination}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="font-bold text-lg">₱{(tour.price || 0).toLocaleString()}/person</span>
          <button onClick={() => handleBookNow(tour, 'tour')} className="bg-green-600 text-white px-4 py-2 rounded-lg">Book Now</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Hero />
      {error && <div className="bg-red-100 text-red-700 text-center p-4">{error}</div>}

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Featured Cars</h2>
                <button onClick={() => navigate('/cars')} className="flex items-center text-blue-600 font-semibold">
                    View All Cars <ArrowRight size={20} className="ml-2"/>
                </button>
            </div>
            {loading ? <p>Loading featured cars...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredCars.map(renderCarCard)}
                </div>
            )}
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Featured Tours</h2>
                <button onClick={() => navigate('/tours')} className="flex items-center text-green-600 font-semibold">
                    View All Tours <ArrowRight size={20} className="ml-2"/>
                </button>
            </div>
             {loading ? <p>Loading featured tours...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredTours.map(renderTourCard)}
                </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default Home;