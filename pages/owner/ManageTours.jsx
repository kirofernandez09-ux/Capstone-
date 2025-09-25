import { useState, useEffect } from 'react';
import { Plus, Edit3, Archive, Eye, EyeOff, Search, MapPin, X } from 'lucide-react';
import DataService from '../../components/services/DataService.jsx';
import ImageUpload from '../../components/ImageUpload.jsx';

const ManageTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitting, setSubmitting] = useState(false);

const initialFormState = {
  title: '',
  description: '',
  destination: '',
  duration: '',
  price: '',
  maxGroupSize: 10,
  difficulty: 'easy',
  category: '',
  inclusions: [],
  exclusions: [],
  itinerary: [],
  images: [],
  available: true, // Changed from undefined to true
  isAvailable: true // Add this field for customer booking
};


  const [formData, setFormData] = useState(initialFormState);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  const categoryOptions = ['Adventure', 'Cultural', 'Nature', 'City', 'Beach', 'Mountain', 'Historical', 'Food'];

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await DataService.fetchAllTours();
      
      // Make sure we have an array of tours
      if (response && Array.isArray(response.data)) {
        setTours(response.data);
      } else if (Array.isArray(response)) {
        setTours(response);
      } else {
        console.error('Unexpected response format:', response);
        setTours([]); // Set to empty array if data format is unexpected
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      alert('Failed to fetch tours');
      setTours([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const resetForm = () => {
    setFormData(initialFormState);
    setNewInclusion('');
    setNewExclusion('');
    setEditingTour(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (uploadedImages) => {
    setFormData(prev => ({ ...prev, images: uploadedImages.map(img => ({ url: img.url, serverId: img.serverId })) }));
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData(prev => ({...prev, inclusions: [...prev.inclusions, newInclusion.trim()]}));
      setNewInclusion('');
    }
  };

  const removeInclusion = (index) => {
    setFormData(prev => ({...prev, inclusions: prev.inclusions.filter((_, i) => i !== index)}));
  };
  
  const addExclusion = () => {
    if (newExclusion.trim()) {
      setFormData(prev => ({...prev, exclusions: [...prev.exclusions, newExclusion.trim()]}));
      setNewExclusion('');
    }
  };

  const removeExclusion = (index) => {
    setFormData(prev => ({...prev, exclusions: prev.exclusions.filter((_, i) => i !== index)}));
  };

  const addItineraryDay = () => {
    setFormData(prev => ({...prev, itinerary: [...prev.itinerary, { day: prev.itinerary.length + 1, activities: '' }]}));
  };

  const removeItineraryDay = (index) => {
    setFormData(prev => ({...prev, itinerary: prev.itinerary.filter((_, i) => i !== index)}));
  };

  const updateItinerary = (index, value) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index].activities = value;
    setFormData(prev => ({...prev, itinerary: newItinerary}));
  };
  
const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  
  const payload = {
    ...formData,
    available: true, // Ensure tours are available by default
    isAvailable: true, // For customer booking
    images: formData.images.map(img => img.url),
  };

  try {
    if (editingTour) {
      await DataService.updateTour(editingTour._id, payload);
      alert('Tour updated successfully!');
    } else {
      await DataService.createTour(payload);
      alert('Tour created successfully and is now available for booking!');
    }
    
    setShowModal(false);
    fetchTours();
  } catch (error) {
    console.error('Error saving tour:', error);
    alert('Failed to save tour');
  } finally {
    setSubmitting(false);
  }
};

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setFormData({
      ...initialFormState,
      ...tour,
      images: tour.images.map(url => ({ url, serverId: url.split('/').pop().split('.')[0] }))
    });
    setShowModal(true);
  };

  const handleArchive = async (tourId) => {
    if (window.confirm('Are you sure you want to archive this tour?')) {
      try {
        await DataService.archiveTour(tourId);
        alert('Tour archived successfully!');
        fetchTours();
      } catch (error) {
        console.error('Error archiving tour:', error);
        alert('Failed to archive tour');
      }
    }
  };

  const handleToggleAvailability = async (tourId) => {
    try {
        const tour = tours.find(t => t._id === tourId);
        await DataService.updateTour(tourId, { ...tour, available: !tour.available });
        fetchTours();
    } catch (error) {
        console.error('Error toggling availability:', error);
        alert('Failed to toggle availability');
    }
  };

  const filteredTours = Array.isArray(tours) 
    ? tours.filter(tour => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = tour.title.toLowerCase().includes(lowerSearchTerm) ||
                            tour.destination.toLowerCase().includes(lowerSearchTerm) ||
                            (tour.category && tour.category.toLowerCase().includes(lowerSearchTerm));
        
        const matchesFilter = filterStatus === 'all' || 
                            (filterStatus === 'available' && tour.available && !tour.archived) ||
                            (filterStatus === 'unavailable' && !tour.available && !tour.archived) ||
                            (filterStatus === 'archived' && tour.archived);
        
        return matchesSearch && matchesFilter;
      })
    : [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Manage Tours</h1><p className="text-gray-600">Add, edit, and manage your tour packages</p></div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"><Plus className="w-5 h-5" />Add New Tour</button>
      </div>

       {/* Filters */}
       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Search tours by title, destination, or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="flex gap-4">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="all">All Tours</option><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="archived">Archived</option></select>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <div key={tour._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gray-200 relative">
                    {tour.images && tour.images.length > 0 ? (<img src={tour.images[0].startsWith('http') ? tour.images[0] : `http://localhost:5000${tour.images[0]}`} alt={tour.title} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><MapPin className="w-16 h-16 text-gray-400" /></div>)}
                    <div className="absolute top-2 left-2 flex flex-col gap-1"><span className={`px-2 py-1 rounded text-xs font-medium ${tour.archived ? 'bg-red-100 text-red-800' : tour.available ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{tour.archived ? 'Archived' : tour.available ? 'Available' : 'Unavailable'}</span></div>
                    <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => handleEdit(tour)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors" title="Edit Tour"><Edit3 className="w-4 h-4 text-gray-600" /></button>
                        {!tour.archived && <button onClick={() => handleToggleAvailability(tour._id)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors" title={tour.available ? 'Mark Unavailable' : 'Mark Available'}>{tour.available ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}</button>}
                        <button onClick={() => handleArchive(tour._id)} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors" title="Archive Tour"><Archive className="w-4 h-4 text-red-600" /></button>
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{tour.title}</h3>
                    <div className="flex items-center justify-between"><span className="text-2xl font-bold text-blue-600">₱{tour.price?.toLocaleString()}</span></div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-900">{editingTour ? 'Edit Tour' : 'Add New Tour'}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button></div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Tour Title *</label><input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full input-field" placeholder="Amazing Palawan Island Tour" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label><input type="text" name="destination" required value={formData.destination} onChange={handleInputChange} className="w-full input-field" placeholder="Palawan, Philippines" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label><input type="text" name="duration" required value={formData.duration} onChange={handleInputChange} className="w-full input-field" placeholder="3 Days 2 Nights" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Price per Person (₱) *</label><input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="w-full input-field" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size *</label><input type="number" name="maxGroupSize" required value={formData.maxGroupSize} onChange={handleInputChange} className="w-full input-field" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label><select name="difficulty" required value={formData.difficulty} onChange={handleInputChange} className="w-full input-field"><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select name="category" required value={formData.category} onChange={handleInputChange} className="w-full input-field"><option value="">Select a category</option>{categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                      </div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} className="w-full input-field" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">Inclusions</label><div className="flex gap-2 mb-2"><input type="text" value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} className="flex-1 input-field" /><button type="button" onClick={addInclusion} className="btn-primary">Add</button></div>{formData.inclusions.map((item, index) => <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded"><span>{item}</span><button type="button" onClick={() => removeInclusion(index)}><X className="w-4 h-4" /></button></div>)}</div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">Exclusions</label><div className="flex gap-2 mb-2"><input type="text" value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} className="flex-1 input-field" /><button type="button" onClick={addExclusion} className="btn-primary">Add</button></div>{formData.exclusions.map((item, index) => <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded"><span>{item}</span><button type="button" onClick={() => removeExclusion(index)}><X className="w-4 h-4" /></button></div>)}</div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">Itinerary</label><button type="button" onClick={addItineraryDay} className="btn-secondary mb-2">Add Day</button>{formData.itinerary.map((item, index) => <div key={index} className="border p-2 rounded mb-2">Day {index + 1}<textarea value={item.activities} onChange={(e) => updateItinerary(index, e.target.value)} className="w-full input-field" rows="2" placeholder="Activities for the day..." /> <button type="button" onClick={() => removeItineraryDay(index)} className="text-red-500">Remove Day</button></div>)}</div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">Images</label><ImageUpload onImagesChange={handleImagesChange} existingImages={formData.images} maxImages={10} /></div>
                      <div className="flex justify-end gap-3 pt-6 border-t"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : (editingTour ? 'Update Tour' : 'Create Tour')}</button></div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManageTours;