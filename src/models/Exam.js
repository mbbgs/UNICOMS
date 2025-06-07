const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: {
    type: [String],
    validate: [arr => arr.length >= 2, 'At least two options required']
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: {
      validator: function(answer) {
        return this.options.includes(answer);
      },
      message: 'Correct answer must be one of the options'
    }
  }
}, {
  timestamps: false
});



const examSchema = new mongoose.Schema({
  courseTitle: {
    type: String,
    required: true,
    lowercase: true
  },
  courseCode: {
    type: String,
    required: true,
    uppercase: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true
    ref:'Department'
  }],
  level: {
    type: String,
    required: true,
    enum: ['100lvl', '200lvl', '300lvl', '400lvl']
  },
  questions: [questionSchema],
  
  isLive: {
    type: Boolean,
    required: true,
    default: false
  }
}, { timestamps: true });

examSchema.statics.getExam = async function(date, departmentId, courseTitle) {
  const exam = await this.findOne({
    date,
    courseTitle: courseTitle.toLowerCase(),
    departments: departmentId
  });
  
  if (!exam) return { found: false, message: 'exam not found' };
  return { found: true, exam };
};

examSchema.statics.createExam = async function({
  date,
  startTime,
  endTime,
  departmentId,
  courseTitle,
  courseCode,
  level,
  questions = []
}) {
  const existing = await this.findOne({
    date: new Date(date),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    courseTitle: courseTitle.toLowerCase(),
    departments: departmentId
  });
  
  if (existing) {
    return { created: false, message: 'Exam already exists for this date, department, and courseTitle' };
  }
  
  const exam = new this({
    date,
    departments: [departmentId],
    courseTitle: courseTitle.toLowerCase(),
    courseCode: courseCode.toUpperCase(),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    level,
    questions
  });
  
  await exam.save();
  return { created: true, exam };
};

examSchema.statics.updateExamDepartment = async function(date, departmentId, courseTitle) {
  const exam = await this.findOne({
    date,
    courseTitle: courseTitle.toLowerCase()
  });
  
  if (!exam) return { updated: false, message: 'exam not found' };
  
  const deptExists = exam.departments.some(deptId => deptId.equals(departmentId));
  if (deptExists) {
    return { updated: false, message: 'Department already associated with exam' };
  }
  
  exam.departments.push(departmentId);
  await exam.save();
  
  return { updated: true, exam };
};

examSchema.statics.removeExamDepartment = async function(date, departmentId, courseTitle) {
  const exam = await this.findOne({
    date,
    courseTitle: courseTitle.toLowerCase()
  });
  
  if (!exam) return { removed: false, message: 'exam not found' };
  
  const index = exam.departments.findIndex(deptId => deptId.equals(departmentId));
  if (index === -1) {
    return { removed: false, message: 'Department not associated with exam' };
  }
  
  exam.departments.splice(index, 1);
  await exam.save();
  
  return { removed: true, exam };
};

module.exports = mongoose.model('Exam', examSchema);