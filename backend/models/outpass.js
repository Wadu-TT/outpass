const mongoose = require('mongoose');
const outpassSchema = new mongoose.Schema({
    studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  wardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  parentMobile: {
    type: String,
    required: true
  },
  leaveDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'parent_verified', 'warden_approved', 'rejected', 'active', 'expired'],
    default: 'pending'
  },
  otpCode: {
    type: String
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  qrCodeData: {
    type: String
  },
  comments: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
const Outpass = mongoose.model('Outpass', outpassSchema);

module.exports = Outpass;