import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Archive, X, MapPin, DollarSign, Calendar, Users, BarChart, Tag } from 'lucide-react';
import DataService from '../../components/services/DataService';
import ImageUpload from '../../components/ImageUpload';

const ManageTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    title: '', destination: '', description: '', price: '', duration: '',
    maxGroupSize: 10, difficulty: 'easy', category: 'nature', images: [], isAvailable: true
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await DataService.fetchAllTours({ archived: false });
      if (response && response.data) setTours(response.data);
    } catch (error) {
      console.error("Failed to fetch tours:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleImagesChange = (uploadedImages) => setFormData(prev => ({ ...prev, images: uploadedImages.map(img => img.url) }));

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setFormData({ ...initialFormState, ...tour });
    setShowModal(true);
  };

  const handleArchive = async (tourId) => {
    if (window.confirm('Are you sure you want to archive this tour?')) {
      await DataService.archiveTour(tourId);
      fetchTours();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTour) {
        await DataService.updateTour(editingTour._id, formData);
      } else {
        await DataService.createTour(formData);
      }
      setShowModal(false);
      fetchTours();
    } catch (error) {
      alert(`Failed to save tour: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const TourCard = ({ tour }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
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
                <div>
                    <button onClick={() => handleEdit(tour)} className="text-blue-600 hover:text-blue-800 p-2"><Edit3 size={18} /></button>
                    <button onClick={() => handleArchive(tour._id)} className="text-red-600 hover:text-red-800 p-2"><Archive size={18} /></button>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Tours</h1>
        <button
          onClick={() => { setEditingTour(null); setFormData(initialFormState); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add New Tour
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map(tour => <TourCard key={tour._id} tour={tour} />)}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingTour ? 'Edit Tour' : 'Add New Tour'}</h2>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField icon={MapPin} name="title" value={formData.title} onChange={handleInputChange} placeholder="Tour Title" required />
                <InputField icon={MapPin} name="destination" value={formData.destination} onChange={handleInputChange} placeholder="Destination" required />
                <InputField icon={Calendar} name="duration" value={formData.duration} onChange={handleInputChange} placeholder="Duration (e.g., 3 Days)" required />
                <InputField icon={DollarSign} type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price per person" required />
                <InputField icon={Users} type="number" name="maxGroupSize" value={formData.maxGroupSize} onChange={handleInputChange} placeholder="Max Group Size" required />
                <SelectField icon={BarChart} name="difficulty" value={formData.difficulty} onChange={handleInputChange} options={['easy', 'moderate', 'challenging']} required />
                <SelectField icon={Tag} name="category" value={formData.category} onChange={handleInputChange} options={['adventure', 'cultural', 'nature', 'beach', 'city']} required />
              </div>
              <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full p-2 border rounded" required />
              <ImageUpload onImagesChange={handleImagesChange} existingImages={formData.images.map(url => ({ url }))} maxImages={10} category="tours" />
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

export default ManageTours;