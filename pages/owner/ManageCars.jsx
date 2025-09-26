import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Archive, X, Car, DollarSign, Calendar, Users, Droplet, Settings, MapPin } from 'lucide-react';
import DataService from '../../components/services/DataService';
import ImageUpload from '../../components/ImageUpload';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    brand: '', model: '', year: new Date().getFullYear(), category: 'economy', seats: 4,
    transmission: 'automatic', fuelType: 'gasoline', pricePerDay: '', location: '',
    description: '', images: [], isAvailable: true
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const response = await DataService.fetchAllCars({ archived: false });
      if (response && response.data) setCars(response.data);
    } catch (error) {
      console.error("Failed to fetch cars:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleImagesChange = (uploadedImages) => setFormData(prev => ({ ...prev, images: uploadedImages.map(img => img.url) }));

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({ ...initialFormState, ...car });
    setShowModal(true);
  };

  const handleArchive = async (carId) => {
    if (window.confirm('Are you sure you want to archive this car?')) {
      await DataService.archiveCar(carId);
      fetchCars();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCar) {
        await DataService.updateCar(editingCar._id, formData);
      } else {
        await DataService.createCar(formData);
      }
      setShowModal(false);
      fetchCars();
    } catch (error) {
      alert(`Failed to save car: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const CarCard = ({ car }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <img
        src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${car.images[0]}`}
        alt={`${car.brand} ${car.model}`}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{car.brand} {car.model}</h3>
        <p className="text-gray-600 text-sm capitalize">{car.category}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="font-bold text-lg">₱{(car.pricePerDay || 0).toLocaleString()}/day</span>
          <div>
            <button onClick={() => handleEdit(car)} className="text-blue-600 hover:text-blue-800 p-2"><Edit3 size={18} /></button>
            <button onClick={() => handleArchive(car._id)} className="text-red-600 hover:text-red-800 p-2"><Archive size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Cars</h1>
        <button
          onClick={() => { setEditingCar(null); setFormData(initialFormState); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add New Car
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => <CarCard key={car._id} car={car} />)}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingCar ? 'Edit Car' : 'Add New Car'}</h2>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField icon={Car} name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Brand" required />
                <InputField icon={Car} name="model" value={formData.model} onChange={handleInputChange} placeholder="Model" required />
                <InputField icon={Calendar} type="number" name="year" value={formData.year} onChange={handleInputChange} placeholder="Year" required />
                <SelectField icon={Car} name="category" value={formData.category} onChange={handleInputChange} options={['economy', 'suv', 'luxury', 'van']} required />
                <InputField icon={DollarSign} type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleInputChange} placeholder="Price Per Day" required />
                <InputField icon={Users} type="number" name="seats" value={formData.seats} onChange={handleInputChange} placeholder="Seats" required />
                <SelectField icon={Settings} name="transmission" value={formData.transmission} onChange={handleInputChange} options={['automatic', 'manual']} required />
                <SelectField icon={Droplet} name="fuelType" value={formData.fuelType} onChange={handleInputChange} options={['gasoline', 'diesel', 'electric', 'hybrid']} required />
                <InputField icon={MapPin} name="location" value={formData.location} onChange={handleInputChange} placeholder="Location" required />
              </div>
              <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full p-2 border rounded" required />
              <ImageUpload onImagesChange={handleImagesChange} existingImages={formData.images.map(url => ({ url }))} maxImages={5} category="cars" />
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-400">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField = ({ icon: Icon, ...props }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input {...props} className="w-full p-2 pl-10 border rounded" />
    </div>
);

const SelectField = ({ icon: Icon, options, ...props }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <select {...props} className="w-full p-2 pl-10 border rounded appearance-none">
            {options.map(option => <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>)}
        </select>
    </div>
);


export default ManageCars;