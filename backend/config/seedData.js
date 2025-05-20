// backend/config/seedData.js
const bcrypt = require('bcrypt');
const { Student, User, Outpass } = require('../models');

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Student.deleteMany({});
    await User.deleteMany({});
    await Outpass.deleteMany({});

    console.log('Database cleared');

    // Create warden user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const warden = await User.create({
      name: 'Warden Kumar',
      email: 'warden@example.com',
      password: hashedPassword,
      role: 'warden'
    });

    // Create security user
    await User.create({
      name: 'Security Singh',
      email: 'security@example.com',
      password: hashedPassword,
      role: 'security'
    });

    // Create students
    const students = await Student.insertMany([
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        rollNumber: 'MT2023001',
        hostelRoom: 'A-101',
        parentName: 'Rajesh Sharma',
        parentMobile: '9876543210'
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        rollNumber: 'MT2023002',
        hostelRoom: 'B-205',
        parentName: 'Suresh Patel',
        parentMobile: '9876543211'
      },
      {
        name: 'Amit Kumar',
        email: 'amit@example.com',
        rollNumber: 'MT2023003',
        hostelRoom: 'C-304',
        parentName: 'Vikram Kumar',
        parentMobile: '9876543212'
      }
    ]);

    // Create sample outpasses
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await Outpass.insertMany([
      {
        studentId: students[0]._id,
        parentMobile: students[0].parentMobile,
        leaveDate: tomorrow,
        returnDate: nextWeek,
        destination: 'Home',
        reason: 'Family function',
        status: 'pending',
        otpCode: '123456',
        otpVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        studentId: students[1]._id,
        parentMobile: students[1].parentMobile,
        leaveDate: tomorrow,
        returnDate: nextWeek,
        destination: 'Delhi',
        reason: 'Medical appointment',
        status: 'parent_verified',
        otpCode: '123456',
        otpVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        studentId: students[2]._id,
        wardenId: warden._id,
        parentMobile: students[2].parentMobile,
        leaveDate: today,
        returnDate: tomorrow,
        destination: 'Jaipur city',
        reason: 'Shopping',
        status: 'warden_approved',
        otpCode: '123456',
        otpVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;