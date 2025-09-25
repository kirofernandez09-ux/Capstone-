import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Archive, X } from 'lucide-react';
import DataService from '../../components/services/DataService';
import ImageUpload from '../../components/ImageUpload';

const ManageCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null); // This will hold the car being edited
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

  // --- EDIT FUNCTIONALITY STARTS HERE ---
  const handleEdit = (car) => {
    setEditingCar(car); // Set the car to be edited
    setFormData({ ...initialFormState, ...car }); // Pre-fill the form with its data
    setShowModal(true); // Open the modal
  };
  // --- EDIT FUNCTIONALITY ENDS HERE ---

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
        // If we are editing, call the update service
        await DataService.updateCar(editingCar._id, formData);
      } else {
        // Otherwise, create a new car
        await DataService.createCar(formData);
      }
      setShowModal(false);
      fetchCars(); // Refresh the list
    } catch (error) {
      alert(`Failed to save car: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

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
          {cars.map(car => (
            <div key={car._id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold">{car.brand} {car.model}</h3>
              <p className="text-sm text-gray-500 capitalize">{car.category}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => handleEdit(car)} className="text-blue-600 hover:text-blue-800"><Edit3 size={18} /></button>
                <button onClick={() => handleArchive(car._id)} className="text-red-600 hover:text-red-800"><Archive size={18} /></button>
              </div>
            </div>
          ))}
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
              {/* Form fields will now be pre-filled when editing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Brand" className="w-full p-2 border rounded" required />
                <input name="model" value={formData.model} onChange={handleInputChange} placeholder="Model" className="w-full p-2 border rounded" required />
                <input type="number" name="year" value={formData.year} onChange={handleInputChange} placeholder="Year" className="w-full p-2 border rounded" required />
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full p-2 border rounded" required>
                    <option value="economy">Economy</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury</option>
                    <option value="van">Van</option>
                </select>
                <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleInputChange} placeholder="Price Per Day" className="w-full p-2 border rounded" required />
                <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Location" className="w-full p-2 border rounded" required />
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

export default ManageCars;