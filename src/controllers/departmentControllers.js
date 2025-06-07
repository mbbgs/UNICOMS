const mongoose = require('mongoose')
const Department = require('../models/Department.js');
const {
  sendJson,
  logError,
  validateCourseInput,
  validateDepartmentInput
} = require('../utils/helpers.js')



module.exports.CreateDepartment = async function(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { faculty, name, code, coursesPerLevel, totalUnitLimit } = req.body;
    
    // Basic field validation
    if (!faculty?.trim() || !name?.trim() || !code?.trim()) {
      return sendJson(res, 400, false, 'Invalid provided inputs');
    }
    
    // Validate coursesPerLevel (must be object with at least one level key)
    if (coursesPerLevel && (
        typeof coursesPerLevel !== 'object' ||
        Array.isArray(coursesPerLevel) ||
        Object.keys(coursesPerLevel).length === 0
      )) {
      
      return sendJson(res, 400, false, 'Provide at least one course level');
    }
    
    const department = new Department({
      name,
      code,
      faculty,
      coursesPerLevel,
      totalUnitLimit
    });
    
    await department.save({ session });
    await session.commitTransaction();
    
    return sendJson(res, 201, true, 'Department created successfully');
  } catch (error) {
    await session.abortTransaction();
    logError('Error creating department', error)
    return sendJson(res, 500, false, 'Internal Server Error');
  } finally {
    session.endSession();
  }
};



module.exports.GetAllDepartments = async function(req, res) {
  try {
    const departments = await Department.find().select('-_id -__v');
    
    if (!departments || departments.length === 0) {
      return sendJson(res, 404, false, 'No departments found');
    }
    
    return sendJson(res, 200, true, 'Departments found', departments);
  } catch (error) {
    logError('Error getting departments', error);
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};



module.exports.GetDepartmentByCode = async function(req, res) {
  try {
    const { code } = req.params
    
    if (!code.trim()) return sendJson(res, 400, false, 'Invalid department code')
    
    const department = await Department.findOne({ code: String(code)?.trim().toUpperCase() }).select('-_id -__v')
    
    if (!department) {
      return sendJson(res, 404, false, 'Department not found');
    }
    return sendJson(res, 200, true, 'Department', department)
  } catch (error) {
    logError('Error getting department by code', error)
    return sendJson(res, 500, false, 'Internal Server Error')
  }
};



module.exports.UpdateDepartment = async function(req, res) {
  try {
    const { name, code, faculty, coursesPerLevel } = req.body;
    
    const update = {};
    if (name && typeof name === 'string') update.name = name.trim().toLowerCase();
    if (code && typeof code === 'string') update.code = code.trim().toUpperCase();
    if (faculty && typeof faculty === 'string') update.faculty = faculty.trim();
    
    if (coursesPerLevel && typeof coursesPerLevel === 'object') {
      const allowedLevels = ['100lvl', '200lvl', '300lvl', '400lvl'];
      const sanitizedCourses = {};
      
      for (const level of allowedLevels) {
        if (Array.isArray(coursesPerLevel[level])) {
          sanitizedCourses[level] = coursesPerLevel[level].map(course => {
            if (
              course &&
              typeof course.title === 'string' &&
              typeof course.code === 'string'
            ) {
              return {
                title: course.title.trim().toLowerCase(),
                code: course.code.trim().toUpperCase()
              };
            }
            return null;
          }).filter(Boolean);
        }
      }
      
      update.coursesPerLevel = sanitizedCourses;
    }
    
    const department = await Department.findOneAndUpdate({ code: String(code).trim().toUpperCase() }, { $set: update }, { new: true, runValidators: true });
    
    if (!department) {
      return sendJson(res, 404, false, 'Department not found')
    }
    
    return sendJson(res, 200, true, 'Update successful')
  } catch (error) {
    logError('Error updating department', error)
    return sendJson(res, 500, false, 'Internal Server Error')
  }
};


// ADD course to a level
module.exports.AddCourseToLevel = async function(req, res) {
  try {
    const { code, level } = req.query;
    const course = req.body;
    
    if (!code.trim() || !level.trim()) return sendJson(res, 400, false, 'Invalid level or code')
    
    const error = validateCourseInput(course);
    if (error) return sendJson(res, 400, false, error)
    
    const department = await Department.findOne({ code: String(code).trim().toUpperCase() });
    
    if (!department) return sendJson(res, 404, false, 'Department not found');
    
    if (!department.coursesPerLevel.has(level.trim())) {
      return sendJson(res, 400, false, `Invalid level: ${level}`);
    }
    
    department.coursesPerLevel.get(level).push(course);
    await department.save();
    
    return sendJson(res, 201, true, 'Course added successfully');
  } catch (error) {
    logError('Error updating department course', error)
    return sendJson(res, 500, false, 'Internal Server Error')
  };
}

module.exports.RemoveCourseFromLevel = async function(req, res) {
  try {
    const { code, level } = req.params;
    const { courseCode } = req.body;
    
    if (!code.trim() || !level.trim()) return sendJson(res, 400, false, 'Invalid departmentcode or level')
    const department = await Department.findOne({ code: String(code).trim().toUpperCase() });
    
    if (!department) return sendJson(res, 404, false, 'Department not found');
    
    const courses = department.coursesPerLevel.get(level);
    if (!courses) return sendJson(res, 404, false, 'Level not found');
    
    const newCourses = courses.filter(course => course.code !== courseCode);
    
    if (newCourses.length === courses.length) {
      return sendJson(res, 404, false, 'Course not found in level');
    }
    
    department.coursesPerLevel.set(level, newCourses);
    await department.save();
    
    return sendJson(res, 200, true, 'Course removed successfully');
  } catch (error) {
    logError('Error removing department course', error)
    return sendJson(res, 500, false, 'Internal Server Error')
  }
};