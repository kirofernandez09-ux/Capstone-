const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@dorayd.com' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      return;
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@dorayd.com',
      password: 'admin123456',
      role: 'admin',
      phone: '+639171234567',
      isActive: true,
      emailVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: admin123456`);
    console.log(`👑 Role: ${admin.role}`);
    console.log(`📅 Created: 2025-09-03 14:01:22`);
    console.log(`👤 Created by: BlueDrinkingWater`);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();