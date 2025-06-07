const mongoose = require('mongoose')
const Exam = require('../models/Exam.js');
const Department = require('../models/Department.js');
const Submission = require('../models/Submission.js');
const User = require('../models/User.js');
const {
  sendJson,
  logError
} = require('../utils/helpers.js');


const { getClient } = require('../services/redis.js');


// CREATE
module.exports.CreateExam = async function(req, res) {
  try {
    const { date, startTime, endTime, departmentCode, courseTitle, courseCode, level, questions } = req.body;
    
    if (!date || !startTime || !endTime || !departmentCode || !courseTitle || !courseCode || !level) {
      return sendJson(res, 400, false, 'Missing required fields');
    }
    
    const isDepartment = await Department.findOne({ code: String(departmentCode)?.trim().toUpperCase() })
    if (!isDepartment) return sendJson(res, 400, false, 'Department does not exist')
    
    const result = await Exam.createExam({ date, startTime, endTime, departmentId: isDepartment._id, courseTitle, courseCode, level, questions });
    
    if (!result.created) {
      return sendJson(res, 409, false, result.message);
    }
    
    return sendJson(res, 201, true, 'Exam created successfully');
  } catch (error) {
    logError('Error creating exam', error)
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};



// ADD DEPARTMENT
module.exports.AddExamDepartment = async function(req, res) {
  try {
    const { date, code, courseTitle } = req.body;
    
    if (!date || !code || !courseTitle) {
      return sendJson(res, 400, false, 'Missing required fields');
    }
    const isDepartment = await Department.findOne({ code: String(code)?.trim().toUpperCase() })
    if (!isDepartment) return sendJson(res, 400, false, 'Department does not exist')
    
    
    const result = await Exam.updateExamDepartment(date, isDepartment._id, courseTitle);
    
    if (!result.updated) {
      return sendJson(res, 409, false, result.message);
    }
    
    return sendJson(res, 200, true, 'Department added to exam', { data: result.exam });
  } catch (err) {
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};

// REMOVE DEPARTMENT
module.exports.RemoveExamDepartment = async function(req, res) {
  try {
    const { date, code, courseTitle } = req.body;
    
    if (!date || !code || !courseTitle) {
      return sendJson(res, 400, false, 'Missing required fields');
    }
    
    const isDepartment = await Department.findOne({ code: String(code)?.trim().toUpperCase() })
    if (!isDepartment) return sendJson(res, 400, false, 'Department does not exist')
    
    
    const result = await Exam.removeExamDepartment(date, isDepartment._id, courseTitle);
    
    if (!result.removed) {
      return sendJson(res, 409, false, result.message);
    }
    
    return sendJson(res, 200, true, 'Department removed from exam', { data: result.exam });
  } catch (err) {
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};