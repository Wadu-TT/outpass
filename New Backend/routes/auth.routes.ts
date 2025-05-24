import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Register route
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('rollNumber').notEmpty().withMessage('Roll number is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('parentContact1')
      .matches(/^\d{10}$/)
      .withMessage('Parent contact 1 must be a 10-digit number'),
    body('parentContact2')
      .matches(/^\d{10}$/)
      .withMessage('Parent contact 2 must be a 10-digit number'),
  ],
  authController.register
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

// Get profile route
router.get('/profile', authenticate, authController.getProfile);

export default router;