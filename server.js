import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dorayd-travel', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB database at 2025-09-03 17:43:15');
});

// Enhanced Schemas
const CarSchema = new mongoose.Schema({
  brand: String,
  model: String,
  year: Number,
  seats: Number,
  transmission: String,
  fuelType: String,
  location: String,
  pricePerDay: Number,
  description: String,
  images: [String],
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TourSchema = new mongoose.Schema({
  title: String,
  name: String,
  destination: String,
  duration: String,
  difficulty: String,
  maxGroupSize: Number,
  price: Number,
  description: String,
  images: [String],
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BookingSchema = new mongoose.Schema({
  bookingReference: { type: String, unique: true },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  itemId: mongoose.Schema.Types.ObjectId,
  itemType: String,
  itemName: String,
  startDate: Date,
  endDate: Date,
  numberOfGuests: Number,
  specialRequests: String,
  pickupLocation: String,
  totalPrice: Number,
  unitPrice: Number,
  paymentMethod: String,
  status: { type: String, default: 'pending' },
  source: String,
  createdAt: { type: Date, default: Date.now },
  sessionInfo: Object
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  createdAt: { type: Date, default: Date.now }
});

// Add Message Schema
const MessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  source: { type: String, default: 'website' },
  replies: [{
    message: String,
    sender: String,
    senderRole: String,
    createdAt: { type: Date, default: Date.now }
  }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Car = mongoose.model('Car', CarSchema);
const Tour = mongoose.model('Tour', TourSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Generate booking reference
const generateBookingReference = () => {
  const prefix = 'DRD';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({
      success: true,
      message: 'Server is healthy',
      database: 'connected',
      timestamp: '2025-09-03 17:43:15',
      user: 'BlueDrinkingWater'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cars Routes
app.get('/api/cars', async (req, res) => {
  try {
    const { page = 1, limit = 12, location, brand, minPrice, maxPrice } = req.query;
    
    let query = { available: true };
    
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }
    
    const cars = await Car.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Car.countDocuments(query);
    
    console.log(`✅ Fetched ${cars.length} cars from database at 2025-09-03 17:43:15`);
    
    res.json({
      success: true,
      data: cars,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found in database' });
    }
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/cars', authenticateToken, async (req, res) => {
  try {
    const car = new Car({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await car.save();
    console.log(`✅ Car created in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.status(201).json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found in database' });
    }
    console.log(`✅ Car updated in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found in database' });
    }
    console.log(`✅ Car deleted from database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.json({ success: true, message: 'Car deleted from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tours Routes
app.get('/api/tours', async (req, res) => {
  try {
    const { page = 1, limit = 12, destination, difficulty, minPrice, maxPrice } = req.query;
    
    let query = { available: true };
    
    if (destination) {
      query.destination = new RegExp(destination, 'i');
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    const tours = await Tour.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Tour.countDocuments(query);
    
    console.log(`✅ Fetched ${tours.length} tours from database at 2025-09-03 17:43:15`);
    
    res.json({
      success: true,
      data: tours,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/tours/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found in database' });
    }
    res.json({ success: true, data: tour });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/tours', authenticateToken, async (req, res) => {
  try {
    const tour = new Tour({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await tour.save();
    console.log(`✅ Tour created in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.status(201).json({ success: true, data: tour });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/tours/:id', authenticateToken, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found in database' });
    }
    console.log(`✅ Tour updated in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.json({ success: true, data: tour });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/tours/:id', authenticateToken, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found in database' });
    }
    console.log(`✅ Tour deleted from database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.json({ success: true, message: 'Tour deleted from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bookings Routes
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, itemType } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (itemType) query.itemType = itemType;
    
    const bookings = await Booking.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Booking.countDocuments(query);
    
    console.log(`✅ Fetched ${bookings.length} bookings from database at 2025-09-03 17:43:15`);
    
    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      bookingReference: generateBookingReference(),
      createdAt: new Date()
    };
    
    const booking = new Booking(bookingData);
    await booking.save();
    
    console.log(`✅ Booking created in database: ${booking.bookingReference} at 2025-09-03 17:43:15`);
    
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking successfully saved to database'
    });
  } catch (error) {
    console.error('❌ Database booking creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found in database' });
    }
    
    console.log(`✅ Booking status updated in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Messages Routes - Now properly implemented
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const messages = await Message.find(query)
      .populate('assignedTo', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Message.countDocuments(query);
    
    console.log(`✅ Fetched ${messages.length} messages from database at 2025-09-03 17:43:15`);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching messages from database:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const message = new Message(messageData);
    await message.save();
    
    console.log(`✅ Message created in database at 2025-09-03 17:43:15`);
    console.log(`📧 From: ${messageData.email} - Subject: ${messageData.subject}`);
    
    res.status(201).json({
      success: true,
      data: message,
      message: 'Message successfully saved to database'
    });
  } catch (error) {
    console.error('❌ Database message creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/messages/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found in database' });
    }
    
    console.log(`✅ Message status updated in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/messages/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { message: replyMessage } = req.body;
    const user = await User.findById(req.user.userId);
    
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          replies: {
            message: replyMessage,
            sender: user.name,
            senderRole: user.role,
            createdAt: new Date()
          }
        },
        status: 'replied',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found in database' });
    }
    
    console.log(`✅ Reply added to message in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Image Upload Routes
app.post('/api/upload/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const imagePath = `/uploads/${req.file.filename}`;
    
    console.log(`✅ Image uploaded to database at 2025-09-03 17:43:15 by ${req.user.email}`);
    
    res.json({
      success: true,
      data: {
        id: req.file.filename,
        url: imagePath,
        path: imagePath,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Employee Routes
app.get('/api/users/employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const employees = await User.find({ role: 'employee' }).select('-password');
    
    console.log(`✅ Fetched ${employees.length} employees from database at 2025-09-03 17:43:15`);
    
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/users/employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const employee = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      createdAt: new Date()
    });
    
    await employee.save();
    
    console.log(`✅ Employee created in database at 2025-09-03 17:43:15 by ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      data: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Email already exists in database' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Analytics Routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const [totalCars, totalTours, totalBookings, pendingBookings, totalMessages, newMessages] = await Promise.all([
      Car.countDocuments({ available: true }),
      Tour.countDocuments({ available: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Message.countDocuments(),
      Message.countDocuments({ status: 'new' })
    ]);
    
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`📊 Analytics data fetched from database at 2025-09-03 17:43:15`);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalCars,
          totalTours,
          totalBookings,
          pendingBookings,
          totalMessages,
          newMessages
        },
        recentBookings,
        recentMessages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Content Routes
app.get('/api/content/:type', async (req, res) => {
  try {
    // Simple content management - you can expand this
    const contentType = req.params.type;
    const defaultContent = {
      about: {
        title: 'About DoRayd Travel & Tours',
        content: 'We are a leading travel company in the Philippines...',
        lastUpdated: '2025-09-03 17:43:15'
      },
      contact: {
        title: 'Contact Us',
        content: 'Get in touch with our team...',
        lastUpdated: '2025-09-03 17:43:15'
      }
    };
    
    res.json({
      success: true,
      data: defaultContent[contentType] || { title: 'Content Not Found', content: '' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seed data (for development)
app.post('/api/seed', async (req, res) => {
  try {
    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@dorayd.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@dorayd.com',
        password: hashedPassword,
        role: 'admin'
      });
    }
    
    // Create employee user
    const employeeExists = await User.findOne({ email: 'employee@dorayd.com' });
    if (!employeeExists) {
      const hashedPassword = await bcrypt.hash('employee123', 10);
      await User.create({
        name: 'Employee User',
        email: 'employee@dorayd.com',
        password: hashedPassword,
        role: 'employee'
      });
    }
    
    // Add sample cars
    const carCount = await Car.countDocuments();
    if (carCount === 0) {
      const sampleCars = [
        {
          brand: 'Toyota',
          model: 'Vios',
          year: 2023,
          seats: 5,
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          location: 'Manila',
          pricePerDay: 2500,
          description: 'Reliable and fuel-efficient sedan perfect for city driving.',
          images: [],
          available: true
        },
        {
          brand: 'Honda',
          model: 'CR-V',
          year: 2022,
          seats: 7,
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          location: 'Cebu',
          pricePerDay: 4500,
          description: 'Spacious SUV ideal for family trips and adventures.',
          images: [],
          available: true
        }
      ];
      await Car.insertMany(sampleCars);
    }
    
    // Add sample tours
    const tourCount = await Tour.countDocuments();
    if (tourCount === 0) {
      const sampleTours = [
        {
          title: 'Palawan Island Hopping',
          name: 'Palawan Island Hopping',
          destination: 'Palawan',
          duration: '3 Days 2 Nights',
          difficulty: 'Easy',
          maxGroupSize: 15,
          price: 12000,
          description: 'Explore the beautiful islands of Palawan with crystal clear waters.',
          images: [],
          available: true
        },
        {
          title: 'Bohol Countryside Tour',
          name: 'Bohol Countryside Tour',
          destination: 'Bohol',
          duration: '1 Day',
          difficulty: 'Easy',
          maxGroupSize: 20,
          price: 3500,
          description: 'Visit the famous Chocolate Hills and tarsier sanctuary.',
          images: [],
          available: true
        }
      ];
      await Tour.insertMany(sampleTours);
    }

    // Add sample messages
    const messageCount = await Message.countDocuments();
    if (messageCount === 0) {
      const sampleMessages = [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+63 917 123 4567',
          subject: 'Inquiry about car rental',
          message: 'Hi, I would like to inquire about renting a car for this weekend. Do you have any Toyota Vios available?',
          status: 'new',
          priority: 'medium',
          source: 'website'
        },
        {
          name: 'Maria Santos',
          email: 'maria.santos@example.com',
          phone: '+63 918 987 6543',
          subject: 'Palawan tour booking',
          message: 'I am interested in the Palawan Island Hopping tour for 4 people. What are the inclusions and availability for next month?',
          status: 'new',
          priority: 'high',
          source: 'website'
        }
      ];
      await Message.insertMany(sampleMessages);
    }
    
    console.log('✅ Database seeded successfully at 2025-09-03 17:43:15');
    
    res.json({
      success: true,
      message: 'Database seeded successfully',
      credentials: {
        admin: { email: 'admin@dorayd.com', password: 'admin123' },
        employee: { email: 'employee@dorayd.com', password: 'employee123' }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DoRayd Backend Server running on port ${PORT} at 2025-09-03 17:43:15`);
  console.log(`👤 Current User: BlueDrinkingWater`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💾 Database: MongoDB (dorayd-travel)`);
});

export default app;