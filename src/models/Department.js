const mongoose = require('mongoose');


const courseSchema = new mongoose.Schema({
  courseTitle: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  units: {
    type: Number,
    required: true
  },
  session: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['First', 'Second']
  },
  description: {
    type: String
  }
}, { _id: false, __v: false });

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
        },
        validate: {
          validator: function(map) {
            const allowedLevels = ['100lvl', '200lvl', '300lvl', '400lvl'];
            return [...map.keys()].every(k => allowedLevels.includes(k));
          },
          message: props => `Invalid level key in coursesPerLevel: ${[...props.value.keys()].join(', ')}`
        }
      },
      {
        timestamps: true
      });
    
    module.exports = mongoose.model('Department', departmentSchema);