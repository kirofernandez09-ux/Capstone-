import Tour from '../models/Tour.js';
import Booking from '../models/Booking.js';

export const getAllTours = async (req, res) => {
  try {
    const { page = 1, limit = 10, destination, minPrice, maxPrice, featured, isAvailable } = req.query;
    const query = { archived: false };

    // This robust logic correctly builds the database query
    if (featured) {
        query.featured = featured === 'true';
    }

    if (isAvailable) {
        query.isAvailable = isAvailable === 'true';
    }
    
    // Only add destination to the query if it's not an empty string
    if (destination) {
        query.destination = new RegExp(destination, 'i'); // Case-insensitive search
    }

    // Safely handle price filtering to prevent crashes
    if (minPrice || maxPrice) {
        query.price = {};
        // Only add minPrice to the query if it's a valid number
        if (minPrice && !isNaN(minPrice)) {
            query.price.$gte = Number(minPrice);
        }
        // Only add maxPrice to the query if it's a valid number
        if (maxPrice && !isNaN(maxPrice)) {
            query.price.$lte = Number(maxPrice);
        }
    }

    const tours = await Tour.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Tour.countDocuments(query);
    res.json({ success: true, data: tours, pagination: { total, page: parseInt(page) } });
  } catch (error) {
    // Added more detailed error logging for easier debugging
    console.error('Error fetching tours:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tours', error: error.message });
  }
};

export const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });
    res.json({ success: true, data: tour });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createTour = async (req, res) => {
  try {
    const tour = new Tour(req.body);
    await tour.save();
    res.status(201).json({ success: true, data: tour });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });
    res.json({ success: true, data: tour });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const archiveTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, { archived: true, isAvailable: false }, { new: true });
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });
    res.json({ success: true, message: "Tour archived", data: tour });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};