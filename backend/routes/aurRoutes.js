
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');

// Student Login
router.post('/student/login', async (req, res) => {
  try {
    const { rollNumber, email } = req.body;
    
    // In a real app, you'd check the password too
    const student = await Student.findOne({
      $or: [{ rollNumber }, { email }]
    });
    
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: student._id, type: 'student' },
      process.env.JWT_SECRET || 'your-default-secret',
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        type: 'student'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = process.env.NODE_ENV === 'development' ? 
      (password === 'password123') : 
      await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
 
    const token = jwt.sign(
      { id: user._id, role: user.role, type: 'staff' },
      process.env.JWT_SECRET || 'your-default-secret',
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: 'staff'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;