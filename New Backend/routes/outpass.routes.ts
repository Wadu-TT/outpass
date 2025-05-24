import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeAdmin } from '../middlewares/auth.middleware.js';
import outpassController from '../controllers/outpass.controller.js';

const router = express.Router();

// Create outpass request
router.post(
  '/',
  authenticate,
  [
    body('startDateTime')
      .notEmpty()
      .withMessage('Start date and time is required')
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('endDateTime')
      .notEmpty()
      .withMessage('End date and time is required')
      .isISO8601()
      .withMessage('Invalid end date format'),
    body('reason')
      .notEmpty()
      .withMessage('Reason is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters'),
  ],
  outpassController.createOutpass
);

// Get all outpasses for current student
router.get('/my', authenticate, outpassController.getMyOutpasses);

// Get QR code for a specific approved outpass
router.get('/:id/qrcode', authenticate, outpassController.getOutpassQRCode);

// Admin: Update outpass status (approve/reject)
router.patch(
  '/:id/status',
  authenticate,
  authorizeAdmin,
  [body('status').isIn(['approved', 'rejected']).withMessage('Invalid status')],
  outpassController.updateOutpassStatus
);

// Verify QR code (for gatekeepers/admin)
router.post(
  '/verify',
  authenticate,
  authorizeAdmin,
  [body('qrData').notEmpty().withMessage('QR code data is required')],
  outpassController.verifyQRCode
);

export default router;