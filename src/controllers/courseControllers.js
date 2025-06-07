const mongoose = require('mongoose');
const User = require('../models/User.js');
const Department = require('../models/Department.js');

const {
  sendJson,
  logError,
  trimBody
} = require('../utils/helpers.js');

const { DEPARTMENT_MIN_UNIT, TOTAL_UNIT_LIMIT } = require('../constants.js')

module.exports.GetDepartmentCourses = async function(req, res) {
  try {
    const { level, faculty, code: departmentCode } = req.body;
    
    if (!level?.trim() || !faculty?.trim() || !departmentCode?.trim()) {
      return sendJson(res, 400, false, 'Provide level, faculty, and department code to continue');
    }
    
    const department = await Department.findOne({
      faculty: trimBody(faculty),
      code: trimBody(departmentCode)
    }).lean();
    
    if (!department) {
      return sendJson(res, 404, false, 'Incorrect faculty or department code');
    }
    
    const levelKey = trimBody(level);
    const courses = department.coursesPerLevel?.[levelKey];
    
    if (!courses) {
      return sendJson(res, 400, false, 'Invalid level or no courses found for this level');
    }
    
    return sendJson(res, 200, true, `${department.name} — ${levelKey} courses`, { courses });
    
  } catch (error) {
    logError('Error getting department courses', error);
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};


module.exports.RegisterCourses = async function(req, res) {
  const user = req?.user;
  if (!user) return sendJson(res, 401, false, 'User not authorized');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId } = user;
    const { courses = [] } = req.body;
    
    if (!Array.isArray(courses) || courses.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, 'Courses must be a non-empty array');
    }
    
    
    const student = await User.findOne({ userId, role: 'Student' })
      .populate('department')
      .session(session);
    
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 404, false, 'Student does not exist');
    }
    
    const levelKey = trimBody(student.level);
    const availableCourses = student.department.coursesPerLevel?.get(levelKey);
    
    if (!availableCourses || availableCourses.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 404, false, `No courses available for ${levelKey}`);
    }
    
    // Get existing registered course codes to avoid duplicates
    const existingCodes = student.registeredCourses.map(rc => rc.course.courseCode);
    
    const validNewCourses = [];
    for (const courseCode of courses) {
      if (typeof courseCode !== 'string' || !courseCode.trim()) continue;
      
      const match = availableCourses.find(c => c.courseCode === courseCode.trim().toUpperCase());
      
      if (match && !existingCodes.includes(match.courseCode)) {
        validNewCourses.push({
          isCarryOver: false,
          course: match
        });
      }
    }
    
    if (validNewCourses.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, 'No valid new courses to register');
    }
    
    const updatedCourses = [...student.registeredCourses, ...validNewCourses];
    
    const totalUnits = updatedCourses.reduce((sum, c) => sum + (c.course.units || 0), 0);
    
    if (totalUnits < DEPARTMENT_MIN_UNIT) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, `Total units (${totalUnits}) less than minimum required (${DEPARTMENT_MIN_UNIT})`);
    }
    
    if (totalUnits > TOTAL_UNIT_LIMIT) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, `Total units (${totalUnits}) exceed limit (${TOTAL_UNIT_LIMIT})`);
    }
    
    student.registeredCourses = updatedCourses;
    await student.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return sendJson(res, 200, true, 'Courses registered successfully', {
      registeredCourses: updatedCourses,
      totalUnits
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logError('Error registering courses', error);
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};


module.exports.UpdateRegisteredCourses = async function(req, res) {
  const user = req?.user;
  if (!user) return sendJson(res, 401, false, 'User not authorized');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId } = user;
    const { coursesToAdd = [] } = req.body;
    
    if (!Array.isArray(coursesToAdd) || coursesToAdd.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, 'coursesToAdd must be a non-empty array');
    }
    
    
    
    const student = await User.findOne({ userId, role: 'Student' })
      .populate('department')
      .session(session);
    
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 404, false, 'Student not found');
    }
    
    const levelKey = trimBody(student.level);
    const availableCourses = student.department.coursesPerLevel?.get(levelKey);
    
    if (!availableCourses || availableCourses.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 404, false, `No available courses for ${levelKey}`);
    }
    
    // Extract existing registered course codes to avoid duplicates
    const existingCodes = student.registeredCourses.map(rc => rc.course.courseCode);
    
    // Prepare valid new courses with nested course & isCarryOver
    const validNewCourses = [];
    for (const input of coursesToAdd) {
      const code = typeof input === 'string' ? input : input.courseCode;
      const isCarryOver = typeof input === 'object' ? !!input.isCarryOver : false;
      
      const match = availableCourses.find(c => c.courseCode === code);
      
      if (match && !existingCodes.includes(code)) {
        validNewCourses.push({
          isCarryOver,
          course: match
        });
      }
    }
    
    if (validNewCourses.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, 'No valid new courses to add');
    }
    
    const updatedCourses = [...student.registeredCourses, ...validNewCourses];
    
    // Calculate total units considering nested structure
    const totalUnits = updatedCourses.reduce((sum, c) => sum + (c.course.units || 0), 0);
    
    if (totalUnits < DEPARTMENT_MIN_UNIT) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, `Total units (${totalUnits}) less than minimum required (${DEPARTMENT_MIN_UNIT})`);
    }
    
    if (totalUnits > TOTAL_UNIT_LIMIT) {
      await session.abortTransaction();
      session.endSession();
      return sendJson(res, 400, false, `Total units (${totalUnits}) exceed limit (${TOTAL_UNIT_LIMIT})`);
    }
    
    student.registeredCourses = updatedCourses;
    await student.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return sendJson(res, 200, true, 'Courses updated successfully', {
      registeredCourses: updatedCourses,
      totalUnits
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logError('Error updating registered courses', error);
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};