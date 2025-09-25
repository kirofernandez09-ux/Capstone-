import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useParams, useNavigate } from "react-router-dom";

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ currency: '₱' }); // Default currency

  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    // Fetch app config from backend
    const fetchConfig = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/config');
        const configData = await response.json();
        setConfig(configData);
      } catch (error) {
        console.error('Failed to fetch config:', error);
        // Keep default config
      }
    };

    // Fetch car data
    const fetchCar = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/cars/${id}`);
        if (!response.ok) {
          throw new Error("Car not found");
        }
        const data = await response.json();
        setCar(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
    fetchCar();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pickupDate || !returnDate) return alert("Please fill both dates.");
    if (new Date(returnDate) < new Date(pickupDate))
      return alert("Return date must be after pickup date.");
    alert("Booking submitted!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (!car) return <div className="p-10 text-center text-red-500">Car not found.</div>;

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-10">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer"
      >
        <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" />
        Back to all cars
      </button>

      {/* Top: Car image & Booking Form */}
      <div className="grid md:grid-cols-2 gap-6 items-start mb-10">
        {/* Car Image & Basic Info */}
        <div>
          <div className="w-full h-[16rem] sm:h-[20rem] lg:h-[24rem] rounded-lg overflow-hidden mb-4">
            <img
              src={car.image || car.images?.[0] || '/placeholder-car.jpg'}
              alt={`${car.brand} ${car.model}`}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold">{car.brand} {car.model}</h1>
          <p className="text-gray-500 text-md">{car.category} · {car.year}</p>
        </div>

        {/* Booking Form */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Book This Car</h2>
          <p className="mb-4">
            <span className="text-lg font-bold">{config.currency}{car.pricePerDay}</span>{" "}
            <span className="text-base text-gray-400 font-normal">/ day</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Book Now
            </button>
          </form>
        </div>
      </div>

      {/* Car Info Icons */}
      <hr className="border-gray-300 my-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: assets.users_icon, text: `${car.seating_capacity} Seats` },
          { icon: assets.fuel_icon, text: car.fuel_type },
          { icon: assets.car_icon, text: car.transmission },
          { icon: assets.location_icon, text: car.location },
        ].map(({ icon, text }) => (
          <div key={text} className="flex flex-col items-center bg-gray-50 p-4 rounded-lg">
            <img src={icon} alt="" className="h-5 mb-2" />
            <span className="text-sm text-center">{text}</span>
          </div>
        ))}
      </div>

      {/* Description & Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <div>
          <h2 className="text-xl font-medium mb-3">Description</h2>
          <p className="text-gray-500 mb-6">{car.description}</p>
        </div>

        <div>
          <h2 className="text-xl font-medium mb-3">Features</h2>
          <ul className="space-y-2">
            {["360 Camera", "Bluetooth", "GPS", "Heated Seats", "Rear View"].map((item) => (
              <li key={item} className="flex items-center text-gray-500">
                <img src={assets.check_icon} className="h-4 mr-2" alt="" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;