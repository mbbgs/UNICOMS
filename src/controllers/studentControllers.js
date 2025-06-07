const mongoose = require('mongoose');
const User = require('../models/User.js');
const Department = require('../models/Department.js')
const fs = require('fs')

const { parseStudentCSV } = require('../services/csvService');
const { logError, sendJson, userData } = require('../utils/helpers.js')
const { hashToken: hashPassword } = require('../services/Scrypt.js')


module.exports.AddStudent = async function(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  
  try {
    const { name, faculty, email, password, matric, departmentCode } = req.body;
    
    if (!name || !faculty || !email || !password || !matric || !department) {
      return sendJson(res, 400, false, 'All student fields are required');
    }
    if (name.split(' ').length < 2) {
      return sendJson(res, 400, false, 'student name should be in format: <firstName> <otherNames>')
    }
    
    const firstName = name.split(' ')[0]
    const otherNames = name.split(' ')[1]
    
    // Check for duplicate matric or email
    const existingStudent = await User.findOne({ $or: [{ email }, { matric }], role: 'student' });
    if (existingStudent) {
      return sendJson(res, 409, false, 'Student with email or matric number already exists');
    }
    
    
    const hashedPass = await hashPassword(password.trim())
    
    const isDepartment = await Department.findOne({ code: String(departmentCode).trim() })
    
    if (!isDepartment) return sendJson(res, 400, false, `Department does not exist:: ${departmentCode}`)
    
    const student = new User({
      firstName,
      otherNames,
      email,
      password: hashedPass,
      matric,
      department: isDepartment._id,
      faculty,
      role: 'Student'
    });
    
    await student.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return sendJson(res, 201, true, 'Student created successfully', student);
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logError('Error adding student', error);
    return sendJson(res, 500, false, 'Internal server error occurred');
  }
};


module.exports.AddStudentsFromCSV = async function(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.file) {
      return sendJson(res, 400, false, 'CSV file is required');
    }
    
    const filePath = req.file.path;
    const students = await parseStudentCSV(filePath);
    
    if (!students.length) {
      return sendJson(res, 400, false, 'CSV file is empty or invalid');
    }
    
    
    const departments = await Department.find({}, { code: 1 });
    const validDepartments = new Map(departments.map(d => [d.code.trim(), d._id]));
    
    // Validate students before insert
    for (const s of students) {
      const email = String(s.email).trim();
      const matric = String(s.matric).trim();
      const deptCode = String(s.department).trim();
      
      // Check duplicates
      const exists = await User.findOne({
        $or: [{ email }, { matric }]
      }).session(session);
      if (exists) throw new Error(`Duplicate student: ${email} or ${matric}`);
      
      // Check department validity
      const deptId = validDepartments.get(deptCode);
      if (!deptId) throw new Error(`Invalid department code: ${deptCode}`);
      
      s.department = deptId;
      s.password = await hashPassword(String(s.password).trim());
    }
    
    
    await User.insertMany(students, { session });
    await session.commitTransaction();
    
    fs.unlinkSync(filePath);
    return sendJson(res, 201, true, `${students.length} students added successfully`);
    
  } catch (error) {
    await session.abortTransaction();
    if (req.file?.path) fs.unlinkSync(req.file.path);
    logError('Error importing students from CSV', error);
    return sendJson(res, 500, false, 'Internal Server Error');
  } finally {
    session.endSession()
  }
};



module.exports.GetStudent = async function(req, res) {
  try {
    
    const { studentId = '' } = req.body
    if (!studentId.trim()) {
      return sendJson(res, 400, false, 'Invalid studentID')
    }
    const isUser = await User.findOne({ userId: studentId, role: 'Student' }).select('-_id -password')
    if (!isUser) {
      return sendJson(res, 404, false, 'student does not exist')
    }
    const data = userData(isUser)
    
    return sendJson(res, 200, true, 'student found', data)
  } catch (error) {
    logError('Error getting student', error)
    return sendJson(res, 500, false, 'Internal Server Error')
  }
}