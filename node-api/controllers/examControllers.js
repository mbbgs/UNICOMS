const Exam = require('../models/Exam');
const {
  sendJson,
  logError
} = require('../utils/helpers.js');



// CREATE
module.exports.createExam = async function(req, res) {
  try {
    const { date, departmentName, courseTitle, courseCode, level, questions } = req.body;
    
    if (!date || !departmentName || !courseTitle || !courseCode || !level) {
      return sendJson(res, 400, false, 'Missing required fields');
    }
    
    const result = await Exam.createExam({ date, departmentName, courseTitle, courseCode, level, questions });
    
    if (!result.created) {
      return sendJson(res, 409, false, result.message);
    }
    
    return sendJson(res, 201, true, 'Exam created successfully');
  } catch (error) {
    logError('Error creating exam', error)
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};

// READ
module.exports.getExam = async function(req, res) {
  try {
    const { date, departmentName, courseTitle } = req.query;
    
    if (!date || !departmentName || !courseTitle) {
      return sendJson(res, 400, false, 'Missing query parameters');
    }
    
    const result = await Exam.getExam(date, departmentName, courseTitle);
    
    if (!result.found) {
      return sendJson(res, 404, false, result.message);
    }
    
    return sendJson(res, 200, true, 'Exam retrieved successfully', { data: result.exam });
  } catch (error) {
    logError('Error getting exam', error)
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};

// ADD DEPARTMENT
module.exports.addExamDepartment = async function(req, res) {
  try {
    const { date, departmentId, courseTitle } = req.body;
    
    if (!date || !departmentId || !courseTitle) {
      return sendJson(res, 400, false, 'Missing required fields');
    }
    
    const result = await Exam.updateExamDepartment(date, departmentId, courseTitle);
    
    if (!result.updated) {
      return sendJson(res, 409, false, result.message);
    }
    
    return sendJson(res, 200, true, 'Department added to exam', { data: result.exam });
  } catch (err) {
    return sendJson(res, 500, false, err.message);
  }
};

// REMOVE DEPARTMENT
module.exports.removeExamDepartment = async function(req, res) {
  try {
    const { date, departmentId, courseTitle } = req.body;
    
    if (!date || !departmentId || !courseTitle) {
      return sendJson(res, 400, false, 'Missing required fields');
    }
    
    const result = await Exam.removeExamDepartment(date, departmentId, courseTitle);
    
    if (!result.removed) {
      return sendJson(res, 409, false, result.message);
    }
    
    return sendJson(res, 200, true, 'Department removed from exam', { data: result.exam });
  } catch (err) {
    return sendJson(res, 500, false, err.message);
  }
};