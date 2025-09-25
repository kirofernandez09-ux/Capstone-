import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Archive, Eye, EyeOff, Search, Car, Users, Fuel, Settings2, X, MapPin } from 'lucide-react';
import DataService from '../../components/services/DataService';
import ImageUpload from '../../components/ImageUpload';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitting, setSubmitting] = useState(false);

const initialFormState = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  seats: 5,
  transmission: 'automatic',
  fuelType: 'gasoline',
  pricePerDay: '',
  location: '',
  description: '',
  features: [],
  images: [],
  available: true, 
  isAvailable: true 
};

  const [formData, setFormData] = useState(initialFormState);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const data = await DataService.fetchAllCars();
      setCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
      alert('Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setNewFeature('');
    setEditingCar(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (uploadedImages) => {
    setFormData(prev => ({ ...prev, images: uploadedImages.map(img => ({ url: img.url, serverId: img.serverId })) }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

// In ManageCars.jsx - handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  const payload = {
    ...formData,
    available: true, // Ensure cars are available by default
    isAvailable: true, // For customer booking
    images: formData.images.map(img => img.url),
  };
  
  try {
    if (editingCar) {
      await DataService.updateCar(editingCar._id, payload);
      alert('Car updated successfully!');
    } else {
      await DataService.createCar(payload);
      alert('Car created successfully and is now available for booking!');
    }
    
    setShowModal(false);
    fetchCars(); // Refresh the cars list in this component
    
    // Notify other components that cars data has changed
    // You could implement a global state management or event system here
  } catch (error) {
    console.error('Error saving car:', error);
    alert('Failed to save car');
  } finally {
    setSubmitting(false);
  }
};

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      ...initialFormState,
      ...car,
      images: car.images.map(url => ({ url, serverId: url.split('/').pop().split('.')[0] }))
    });
    setShowModal(true);
  };
  
  const handleArchive = async (carId) => {
    if (window.confirm('Are you sure you want to archive this car?')) {
      try {
        await DataService.archiveCar(carId);
        alert('Car archived successfully!');
        fetchCars();
      } catch (error) {
        console.error('Error archiving car:', error);
        alert('Failed to archive car');
      }
    }
  };

  const handleToggleAvailability = async (carId) => {
    try {
      const car = cars.find(c => c._id === carId);
      await DataService.updateCar(carId, { ...car, available: !car.available });
      fetchCars();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to toggle availability');
    }
  };
const filteredCars = Array.isArray(cars) 
  ? cars.filter(car => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = car.brand.toLowerCase().includes(lowerSearchTerm) ||
                         car.model.toLowerCase().includes(lowerSearchTerm) ||
                         car.location.toLowerCase().includes(lowerSearchTerm);
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'available' && car.available && !car.archived) ||
                         (filterStatus === 'unavailable' && !car.available && !car.archived) ||
                         (filterStatus === 'archived' && car.archived);
    
    return matchesSearch && matchesFilter;
     })
  : [];

  // Main JSX Render
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Cars</h1>
          <p className="text-gray-600">Add, edit, and manage your car fleet</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Car
        </button>
      </div>

       {/* Filters */}
       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search cars by brand, model, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cars</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

       {/* Cars Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <div key={car._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                {car.images && car.images.length > 0 ? (
                  <img
                    src={car.images[0].startsWith('http') ? car.images[0] : `http://localhost:5000${car.images[0]}`}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    car.archived ? 'bg-red-100 text-red-800' :
                    car.available ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {car.archived ? 'Archived' : car.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => handleEdit(car)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors" title="Edit Car"><Edit3 className="w-4 h-4 text-gray-600" /></button>
                  {!car.archived && <button onClick={() => handleToggleAvailability(car._id)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors" title={car.available ? 'Mark Unavailable' : 'Mark Available'}>{car.available ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}</button>}
                  <button onClick={() => handleArchive(car._id)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors" title="Archive Car"><Archive className="w-4 h-4 text-red-600" /></button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-semibold text-gray-900">{car.brand} {car.model}</h3><span className="text-sm text-gray-500">{car.year}</span></div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>{car.seats} seats</span></div>
                  <div className="flex items-center gap-2"><Settings2 className="w-4 h-4" /><span className="capitalize">{car.transmission}</span></div>
                  <div className="flex items-center gap-2"><Fuel className="w-4 h-4" /><span className="capitalize">{car.fuelType}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{car.location}</span></div>
                </div>
                <div className="flex items-center justify-between"><span className="text-2xl font-bold text-blue-600">₱{car.pricePerDay?.toLocaleString()}/day</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-900">{editingCar ? 'Edit Car' : 'Add New Car'}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button></div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label><input type="text" name="brand" required value={formData.brand} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Toyota, Honda, etc." /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Model *</label><input type="text" name="model" required value={formData.model} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Camry, Civic, etc." /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Year *</label><input type="number" name="year" required min="1990" max={new Date().getFullYear() + 1} value={formData.year} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Seats *</label><select name="seats" required value={formData.seats} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">{[2, 4, 5, 6, 7, 8, 9, 12, 15].map(num => (<option key={num} value={num}>{num} seats</option>))}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Transmission *</label><select name="transmission" required value={formData.transmission} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="automatic">Automatic</option><option value="manual">Manual</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type *</label><select name="fuelType" required value={formData.fuelType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="gasoline">Gasoline</option><option value="diesel">Diesel</option><option value="hybrid">Hybrid</option><option value="electric">Electric</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Price Per Day (₱) *</label><input type="number" name="pricePerDay" required min="0" step="0.01" value={formData.pricePerDay} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2500.00" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Location *</label><input type="text" name="location" required value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Manila, Cebu, etc." /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" rows="4" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the car features, condition, etc." /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <div className="flex gap-2 mb-2"><input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add a feature (e.g., Air Conditioning, GPS)" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} /><button type="button" onClick={addFeature} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button></div>
                  {formData.features.length > 0 && (<div className="flex flex-wrap gap-2">{formData.features.map((feature, index) => (<span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{feature}<button type="button" onClick={() => removeFeature(index)} className="text-blue-600 hover:text-blue-800"><X className="w-3 h-3" /></button></span>))}</div>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  <ImageUpload onImagesChange={handleImagesChange} existingImages={formData.images} maxImages={5} />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{editingCar ? 'Updating...' : 'Creating...'}</>) : (editingCar ? 'Update Car' : 'Create Car')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCars;