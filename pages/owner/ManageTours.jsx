import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Archive, X } from 'lucide-react';
import DataService from '../../components/services/DataService';
import ImageUpload from '../../components/ImageUpload';

const ManageTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null); // This will hold the tour being edited
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

  // --- EDIT FUNCTIONALITY STARTS HERE ---
  const handleEdit = (tour) => {
    setEditingTour(tour); // Set the tour to be edited
    setFormData({ ...initialFormState, ...tour }); // Pre-fill the form
    setShowModal(true); // Open the modal
  };
  // --- EDIT FUNCTIONALITY ENDS HERE ---

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
        // If editing, call the update service
        await DataService.updateTour(editingTour._id, formData);
      } else {
        // Otherwise, create a new one
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
          {tours.map(tour => (
            <div key={tour._id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold">{tour.title}</h3>
              <p className="text-sm text-gray-500">{tour.destination}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => handleEdit(tour)} className="text-blue-600 hover:text-blue-800"><Edit3 size={18} /></button>
                <button onClick={() => handleArchive(tour._id)} className="text-red-600 hover:text-red-800"><Archive size={18} /></button>
              </div>
            </div>
          ))}
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
                <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Tour Title" className="w-full p-2 border rounded" required />
                <input name="destination" value={formData.destination} onChange={handleInputChange} placeholder="Destination" className="w-full p-2 border rounded" required />
                <input name="duration" value={formData.duration} onChange={handleInputChange} placeholder="Duration (e.g., 3 Days)" className="w-full p-2 border rounded" required />
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price per person" className="w-full p-2 border rounded" required />
                <input type="number" name="maxGroupSize" value={formData.maxGroupSize} onChange={handleInputChange} placeholder="Max Group Size" className="w-full p-2 border rounded" required />
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

export default ManageTours;