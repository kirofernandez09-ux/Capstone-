import Car from '../models/Car.js';

export const getAllCars = async (req, res) => {
  try {
    const { page = 1, limit = 10, brand, location, minPrice, maxPrice, isAvailable } = req.query;
    const query = { archived: false };

    // This robust logic correctly builds the database query
    if (isAvailable) {
        query.isAvailable = isAvailable === 'true';
    }
    
    if (brand) {
        query.brand = new RegExp(brand, 'i');
    }

    if (location) {
        query.location = new RegExp(location, 'i');
    }

    // Safely handle price filtering
    if (minPrice || maxPrice) {
        query.pricePerDay = {};
        if (minPrice && !isNaN(minPrice)) {
            query.pricePerDay.$gte = Number(minPrice);
        }
        if (maxPrice && !isNaN(maxPrice)) {
            query.pricePerDay.$lte = Number(maxPrice);
        }
    }
    
    const cars = await Car.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Car.countDocuments(query);
    
    res.json({ 
        success: true, 
        data: cars, 
        pagination: { total, page: parseInt(page), limit: parseInt(limit) } 
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cars', error: error.message });
  }
};

export const createCar = async (req, res) => {
  try {
    const car = new Car({ ...req.body, owner: req.user.id });
    await car.save();
    res.status(201).json({ success: true, data: car });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- ADDED archiveCar FUNCTION ---
export const archiveCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, { archived: true, isAvailable: false }, { new: true });
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: "Car archived successfully", data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};