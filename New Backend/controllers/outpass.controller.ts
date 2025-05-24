import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Outpass from '../models/outpass.model.js';
import User from '../models/user.model.js';
import qrcode from '../utils/qrcode.js';

// Create a new outpass request
export const createOutpass = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDateTime, endDateTime, reason } = req.body;
    const studentId = req.user._id;

    // Validate dates
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const now = new Date();

    if (startDate < now) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check if student has an active outpass for the same time period
    const existingOutpass = await Outpass.findOne({
      student: studentId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDateTime: { $lte: endDate }, endDateTime: { $gte: startDate } }
      ]
    });

    if (existingOutpass) {
      return res.status(400).json({ 
        message: 'You already have an active or pending outpass for this time period' 
      });
    }

    // Create new outpass
    const outpass = new Outpass({
      student: studentId,
      startDateTime,
      endDateTime,
      reason,
      // Initial status is pending, admin approval needed
      status: 'pending',
    });

    await outpass.save();

    res.status(201).json({
      message: 'Outpass request submitted successfully',
      outpass: {
        id: outpass._id,
        startDateTime: outpass.startDateTime,
        endDateTime: outpass.endDateTime,
        reason: outpass.reason,
        status: outpass.status,
        createdAt: outpass.createdAt,
      },
    });
  } catch (error) {
    console.error('Create outpass error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all outpasses for the current student
export const getMyOutpasses = async (req: Request, res: Response) => {
  try {
    const studentId = req.user._id;
    const { status } = req.query;

    const filter: any = { student: studentId };

    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected', 'used'].includes(status as string)) {
      filter.status = status;
    }

    const outpasses = await Outpass.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ outpasses });
  } catch (error) {
    console.error('Get outpasses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Approve or reject an outpass
export const updateOutpassStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid outpass ID' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const outpass = await Outpass.findById(id);

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' });
    }

    if (outpass.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot update outpass that is already ${outpass.status}` 
      });
    }

    outpass.status = status;
    
    // Generate QR code if approved
    if (status === 'approved') {
      // Get student info
      const student = await User.findById(outpass.student);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Generate QR code
      const { qrCodeBase64, tokenHash } = await qrcode.generateQRCode({
        outpassId: outpass._id.toString(),
        studentId: student._id.toString(),
        studentName: student.name,
        rollNumber: student.rollNumber,
        startDateTime: outpass.startDateTime,
        endDateTime: outpass.endDateTime,
      });
      
      outpass.qrCode = qrCodeBase64;
      outpass.tokenHash = tokenHash;
    }
    
    await outpass.save();

    res.status(200).json({
      message: `Outpass ${status}`,
      outpass: {
        id: outpass._id,
        status: outpass.status,
        qrCode: outpass.status === 'approved' ? outpass.qrCode : undefined,
      },
    });
  } catch (error) {
    console.error('Update outpass status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get QR code for an approved outpass
export const getOutpassQRCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid outpass ID' });
    }

    const outpass = await Outpass.findOne({
      _id: id,
      student: studentId,
      status: 'approved',
    });

    if (!outpass) {
      return res.status(404).json({ 
        message: 'Approved outpass not found' 
      });
    }
    
    // Check if the outpass is still valid (not expired)
    const now = new Date();
    if (now > outpass.endDateTime) {
      return res.status(400).json({ 
        message: 'This outpass has expired' 
      });
    }

    res.status(200).json({
      qrCode: outpass.qrCode,
      startDateTime: outpass.startDateTime,
      endDateTime: outpass.endDateTime,
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify QR code (for gatekeepers/admin)
export const verifyQRCode = async (req: Request, res: Response) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR code data is required' });
    }

    // Verify the QR code data
    const verificationResult = qrcode.verifyQRCodeData(qrData);
    
    if (!verificationResult.isValid) {
      return res.status(400).json({ 
        valid: false, 
        message: verificationResult.error || 'Invalid QR code' 
      });
    }
    
    const decodedData = verificationResult.decodedData;
    
    // Check if outpass exists and is approved
    const outpass = await Outpass.findOne({
      _id: decodedData.outpassId,
      status: 'approved',
    });
    
    if (!outpass) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Outpass not found or not approved' 
      });
    }
    
    // Check if the outpass has been used already
    if (outpass.status === 'used') {
      return res.status(400).json({ 
        valid: false, 
        message: 'Outpass has already been used' 
      });
    }
    
    // Optional: Mark the outpass as used
    // outpass.status = 'used';
    // outpass.usedAt = new Date();
    // await outpass.save();
    
    // Get student details
    const student = await User.findById(outpass.student).select('-password');
    
    // Return validation result
    res.status(200).json({
      valid: true,
      message: 'QR code is valid',
      outpassDetails: {
        outpassId: outpass._id,
        studentName: student?.name,
        rollNumber: student?.rollNumber,
        startDateTime: outpass.startDateTime,
        endDateTime: outpass.endDateTime,
        reason: outpass.reason,
      },
    });
  } catch (error) {
    console.error('Verify QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createOutpass,
  getMyOutpasses,
  updateOutpassStatus,
  getOutpassQRCode,
  verifyQRCode,
};