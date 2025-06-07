const mongoose = require('mongoose')


const submission = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId
    required: true,
    ref: 'User'
  }
  exam: {
    type: mongoose.Schema.Types.ObjectId
    required: true,
    ref: 'Exam'
  },
  answers: [{ type: String, required: true }]
}, {
  timestamps: true
})

module.exports = mongoose.model('Submission', submission)