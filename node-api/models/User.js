const mongoose = require('mongoose')

const resultSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, uppercase: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    default: 'F',
    required: true
  }
}, { _id: false })

const registeredCourseSchema = new mongoose.Schema({
  isCarryOver: { type: Boolean, default: false },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: trueuserId
  }
}, { _id: false })





const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    uppercase: true,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  otherNames: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  isSuperAdmin: {
    type: Boolean,
    required: true,
    default: false
  },
  email: {
    type: String,
    validate: {
      validator: val => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: true
  },
  hasAdminPermission: {
    type: Boolean,
    required: true,
    default: false
  }
  role: {
    type: String,
    enum: ['Student', 'Superadmin', 'Admin'],
    required: true
  },
  department: String,
  faculty: String,
  level: {
    type: String,
    enum: ['100lvl', '200lvl', '300lvl', '400lvl']
  },
  matric: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  registeredCourses: [registeredCourseSchema],
  results: [resultSchema]
}, { timestamps: true })


userSchema.pre('validate', function(next) {
  if (this.role === 'student') {
    if (!this.matric || !this.level || !this.department) {
      return next(new Error('Students must have matric, level, and department'))
    }
  }
  
  if (this.role === 'lecturer') {
    if (!this.department) {
      return next(new Error('Lecturers must have a department'))
    }
  }
  
  next()
})

module.exports = mongoose.model('User', userSchema)