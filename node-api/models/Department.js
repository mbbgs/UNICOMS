const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  }
}, { _id: false });

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  faculty: {
    type: String,
    required: true,
    trim: true
  },
  coursesPerLevel: {
    type: Map,
    of: [courseSchema],
    default: {
      '100lvl': [],
      '200lvl': [],
      '300lvl': [],
      '400lvl': []
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);