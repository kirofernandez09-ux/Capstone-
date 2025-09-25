import Car from '../models/Car.js';

export const getAllCars = async (req, res) => {
  try {
    const query = { archived: false, ...req.query };
    const cars = await Car.find(query);
    res.json({ success: true, data: cars });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cars' });
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

export const archiveCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, { archived: true, isAvailable: false }, { new: true });
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: "Car archived successfully", data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};