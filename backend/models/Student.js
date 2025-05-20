const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  hostelRoom: {
    type: String,
    required: true
  },
  parentName: {
    type: String,
    required: true
  },
  parentMobile: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;