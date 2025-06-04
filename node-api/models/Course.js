const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
  courseTitle: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  units: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  level: {
    type: String,
    required: true,
    enum: ['100lvl', '200lvl', '300lvl', '400lvl']
  },
  session: {
    type: String,
    required: true,
    validate: {
      validator: (val) => {
        return /^\d{4}\/\d{4}$/.test(val);
      },
      message: props => `${props.value} is not a valid session!`
    }
  },
  semester: {
    type: String,
    required: true,
    enum: ['First', 'Second']
  },
  description: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
})

module.exports = mongoose.model('Course', courseSchema)