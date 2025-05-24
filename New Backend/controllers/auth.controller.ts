import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import jwt from '../config/jwt.js';

// Register a new student
export const register = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, rollNumber, password, parentContact1, parentContact2 } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { rollNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or roll number',
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      rollNumber,
      password,
      parentContact1,
      parentContact2,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.generateToken({
      id: user._id,
      name: user.name,
      rollNumber: user.rollNumber,
      isAdmin: user.isAdmin,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.generateToken({
      id: user._id,
      name: user.name,
      rollNumber: user.rollNumber,
      isAdmin: user.isAdmin,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    // User is already attached to req from auth middleware
    const user = req.user;

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        parentContact1: user.parentContact1,
        parentContact2: user.parentContact2,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  register,
  login,
  getProfile,
};