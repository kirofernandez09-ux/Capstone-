import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import User from '../models/User.js';
import Car from '../models/Car.js';
import Tour from '../models/Tour.js';
import Booking from '../models/Booking.js';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@dorayd.com',
    password: 'admin123456',
    role: 'admin',
    phone: '+639171234567',
    isActive: true
  },
  {
    name: 'Employee One',
    email: 'employee1@dorayd.com',
    password: 'employee123',
    role: 'employee',
    phone: '+639171234568',
    isActive: true
  },
  {
    name: 'John Customer',
    email: 'john@example.com',
    password: 'customer123',
    role: 'customer',
    phone: '+639171234569',
    isActive: true
  }
];

const sampleCars = [
  {
    brand: 'Toyota',
    model: 'Vios',
    year: 2023,
    category: 'economy',
    description: 'Reliable and fuel-efficient sedan perfect for city driving and short trips.',
    pricePerDay: 1500,
    seats: 5,
    transmission: 'automatic',
    fuelType: 'gasoline',
    location: 'Manila',
    images: ['/uploads/cars/toyota-vios.jpg'],
    features: ['Air Conditioning', 'Bluetooth', 'GPS Navigation', 'Backup Camera'],
    isAvailable: true,
    plateNumber: 'ABC-1234',
    ratings: { average: 4.5, count: 25 }
  },
  {
    brand: 'Honda',
    model: 'CR-V',
    year: 2022,
    category: 'suv',
    description: 'Spacious SUV ideal for family trips and adventure getaways.',
    pricePerDay: 2500,
    seats: 7,
    transmission: 'automatic',
    fuelType: 'gasoline',
    location: 'Cebu',
    images: ['/uploads/cars/honda-crv.jpg'],
    features: ['4WD', 'Roof Rack', 'Premium Sound System', 'Sunroof'],
    isAvailable: true,
    plateNumber: 'XYZ-5678',
    ratings: { average: 4.8, count: 18 }
  },
  {
    brand: 'Mitsubishi',
    model: 'Montero',
    year: 2021,
    category: 'suv',
    description: 'Rugged SUV built for off-road adventures and mountain trips.',
    pricePerDay: 3000,
    seats: 7,
    transmission: 'manual',
    fuelType: 'diesel',
    location: 'Davao',
    images: ['/uploads/cars/mitsubishi-montero.jpg'],
    features: ['4WD', 'Off-road Tires', 'Heavy Duty Suspension', 'Winch'],
    isAvailable: true,
    plateNumber: 'DEF-9012',
    ratings: { average: 4.6, count: 12 }
  }
];

const sampleTours = [
  {
    title: 'Palawan Underground River Adventure',
    destination: 'Puerto Princesa, Palawan',
    description: 'Explore the world-famous Underground River, a UNESCO World Heritage Site featuring stunning limestone formations and diverse wildlife.',
    price: 8500,
    duration: '3 days, 2 nights',
    maxGroupSize: 15,
    difficulty: 'easy',
    category: 'nature',
    images: ['/uploads/tours/palawan-underground.jpg'],
    itinerary: [
      {
        day: 1,
        title: 'Arrival and City Tour',
        activities: ['Airport pickup', 'Check-in at hotel', 'City tour', 'Dinner at local restaurant'],
        meals: ['dinner'],
        accommodation: 'Hotel Fleuris Palawan'
      },
      {
        day: 2,
        title: 'Underground River Expedition',
        activities: ['Underground River boat tour', 'Lunch at Sabang', 'Beach relaxation', 'Return to city'],
        meals: ['breakfast', 'lunch', 'dinner'],
        accommodation: 'Hotel Fleuris Palawan'
      },
      {
        day: 3,
        title: 'Departure',
        activities: ['Check-out', 'Souvenir shopping', 'Airport transfer'],
        meals: ['breakfast'],
        accommodation: null
      }
    ],
    inclusions: ['Accommodation', 'All meals mentioned', 'Tour guide', 'Transportation', 'Entrance fees'],
    exclusions: ['Airfare', 'Personal expenses', 'Travel insurance', 'Tips'],
    requirements: ['Valid ID', 'Comfortable walking shoes', 'Sun protection'],
    isAvailable: true,
    featured: true,
    ratings: { average: 4.9, count: 45 }
  },
  {
    title: 'Boracay Island Paradise',
    destination: 'Boracay, Aklan',
    description: 'Experience the pristine white beaches and crystal-clear waters of world-famous Boracay Island.',
    price: 6500,
    duration: '4 days, 3 nights',
    maxGroupSize: 20,
    difficulty: 'easy',
    category: 'beach',
    images: ['/uploads/tours/boracay-paradise.jpg'],
    itinerary: [
      {
        day: 1,
        title: 'Arrival and Beach Time',
        activities: ['Airport pickup', 'Hotel check-in', 'Welcome lunch', 'White Beach exploration'],
        meals: ['lunch', 'dinner'],
        accommodation: 'Boracay Beach Resort'
      },
      {
        day: 2,
        title: 'Island Hopping Adventure',
        activities: ['Island hopping tour', 'Snorkeling', 'Beach lunch', 'Sunset sailing'],
        meals: ['breakfast', 'lunch', 'dinner'],
        accommodation: 'Boracay Beach Resort'
      }
    ],
    inclusions: ['Hotel accommodation', 'Daily breakfast', 'Island hopping tour', 'Airport transfers'],
    exclusions: ['Airfare', 'Lunch and dinner (except mentioned)', 'Water activities', 'Personal expenses'],
    requirements: ['Swimwear', 'Sunscreen', 'Waterproof bag'],
    isAvailable: true,
    featured: false,
    ratings: { average: 4.7, count: 32 }
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Car.deleteMany({});
    await Tour.deleteMany({});
    await Booking.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create users
    const users = [];
    for (let userData of sampleUsers) {
      const user = await User.create(userData);
      users.push(user);
      console.log(`👤 Created user: ${user.email}`);
    }

    // Create cars (assign to admin)
    const cars = [];
    for (let carData of sampleCars) {
      const car = await Car.create({
        ...carData,
        owner: users[0]._id // Assign to admin
      });
      cars.push(car);
      console.log(`🚗 Created car: ${car.brand} ${car.model}`);
    }

    // Create tours
    const tours = [];
    for (let tourData of sampleTours) {
      const tour = await Tour.create(tourData);
      tours.push(tour);
      console.log(`🗺️ Created tour: ${tour.title}`);
    }

    // Create sample bookings
    const sampleBookings = [
      {
        itemType: 'car',
        car: cars[0]._id,
        user: users[2]._id,
        guestInfo: {
          firstName: 'John',
          lastName: 'Customer',
          email: 'john@example.com',
          phone: '+639171234569'
        },
        startDate: new Date('2025-09-10'),
        endDate: new Date('2025-09-13'),
        numberOfGuests: 2,
        totalPrice: 4500,
        paymentMethod: 'credit_card',
        status: 'confirmed',
        specialRequests: 'Please include GPS device'
      },
      {
        itemType: 'tour',
        tour: tours[0]._id,
        guestInfo: {
          firstName: 'Jane',
          lastName: 'Traveler',
          email: 'jane@example.com',
          phone: '+639171234570'
        },
        startDate: new Date('2025-09-15'),
        numberOfGuests: 2,
        totalPrice: 17000,
        paymentMethod: 'gcash',
        status: 'pending',
        pickupLocation: 'Makati Hotel'
      }
    ];

    for (let bookingData of sampleBookings) {
      const booking = await Booking.create(bookingData);
      console.log(`📅 Created booking: ${booking.bookingReference}`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded at: ${new Date().toISOString()} by BlueDrinkingWater`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@dorayd.com / admin123456');
    console.log('Employee: employee1@dorayd.com / employee123');
    console.log('Customer: john@example.com / customer123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
if (process.argv[1] === new URL(import.meta.url).pathname) {
  connectDB().then(() => {
    seedDatabase();
  });
}

export { seedDatabase };