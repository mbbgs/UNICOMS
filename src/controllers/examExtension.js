const mongoose = require('mongoose');
const Exam = require('../models/Exam.js');
const Department = require('../models/Department.js');
const Submission = require('../models/Submission.js');
const User = require('../models/User.js');
const {
  sendJson,
  logError,
  getGrade,
  calculateScore,
  trimBody
} = require('../utils/helpers.js');

const { getClient } = require('../services/redis.js');
const {
  SUSPICIOUS_THRESHOLD_MS
} = require('../constants.js');

module.exports.SubmitExam = async function(req, res) {
  const session = await mongoose.startSession();
  try {
    const redis = getClient();
    const student = req.user;
    
    let { examId, answers } = req.body;
    examId = trimBody(examId);
    
    if (!examId || !Array.isArray(answers)) {
      return sendJson(res, 400, false, 'Missing examId or answers');
    }
    if (!student || student.role !== 'Student') {
      return sendJson(res, 401, false, 'Unauthorized or invalid role');
    }
    
    // Load exam and user
    const [user, exam] = await Promise.all([
      User.findOne({ userId: student.userId, role: 'Student' }),
      Exam.findOne({ examId })
    ]);
    
    if (!exam) {
      return sendJson(res, 404, false, 'Exam not found');
    }
    
    const now = new Date();
    if (now < exam.startTime) {
      return sendJson(res, 403, false, 'Exam has not started yet');
    }
    if (now > exam.endTime) {
      return sendJson(res, 403, false, 'Exam has ended');
    }
    
    // Check existing submission
    const existingSubmission = await Submission.findOne({ student: user._id, exam: exam._id });
    if (existingSubmission) {
      return sendJson(res, 409, false, 'You have already submitted this exam');
    }
    
    // Get Redis exam request times for suspicious checking
    const redisKey = `exam:reqtimes:${user.userId}:${examId}`;
    const timestamps = await redis.lRange(redisKey, 0, -1);
    let flaggedSuspicious = false;
    
    if (timestamps.length >= 2) {
      const oldestRequestTime = new Date(timestamps[timestamps.length - 1]);
      const newestRequestTime = new Date(timestamps[0]);
      const timeIntervalMs = newestRequestTime - oldestRequestTime;
      
      if (timeIntervalMs < SUSPICIOUS_THRESHOLD_MS) {
        flaggedSuspicious = true;
        await redis.set(`flag:suspicious:${user.userId}:${examId}`, 'true', { EX: 86400 });
      }
    }
    
    // Start MongoDB transaction
    await session.withTransaction(async () => {
      // Save submission
      const submission = new Submission({
        student: user._id,
        exam: exam._id,
        answers,
      });
      await submission.save({ session });
      
      // Score exam
      const totalQuestions = exam.correctAnswers?.length || answers.length;
      const score = calculateScore(answers, exam.correctAnswers || []);
      const grade = getGrade(score, totalQuestions);
      
      // Update user results
      const userS = await User.findById(user._id).session(session);
      
      const courseCode = exam.courseCode || 'UNKNOWN';
      let resultObj = userS.results.find(r => r.courseCode === courseCode);
      
      if (!resultObj) {
        resultObj = { courseCode, score, grade };
        userS.results.push(resultObj);
      } else {
        // Update if new score is better
        if (score > resultObj.score) {
          resultObj.score = score;
          resultObj.grade = grade;
        }
      }
      
      await userS.save({ session });
    });
    
    session.endSession();
    
    return sendJson(res, 200, true, 'Submission successful', {
      flaggedSuspicious,
    });
  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error submitting exam:', error);
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};

module.exports.GetExam = async function(req, res) {
  const session = await mongoose.startSession();
  
  try {
    const redis = getClient();
    const { date, code, courseTitle } = req.query;
    const student = req.user;
    
    if (!date || !code || !courseTitle) {
      return sendJson(res, 400, false, 'Missing query parameters');
    }
    if (!student || student.role !== 'Student') {
      return sendJson(res, 401, false, 'Unauthorized or invalid role');
    }
    
    const deptCode = String(code).trim().toUpperCase();
    const isDepartment = await Department.findOne({ code: deptCode });
    if (!isDepartment) return sendJson(res, 400, false, 'Department does not exist');
    
    const { found, exam, message } = await Exam.getExam(date, isDepartment._id, courseTitle);
    if (!found) return sendJson(res, 404, false, message);
    
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (now < startTime) {
      return sendJson(res, 403, false, 'Exam has not started yet');
    }
    if (now > endTime) {
      return sendJson(res, 403, false, 'Exam has ended');
    }
    
    const redisKey = `reqtimes:${student.userId}:${exam.examId}`;
    
    // Track request timestamp in Redis (non-transactional)
    await redis.lPush(redisKey, now.toISOString());
    await redis.lTrim(redisKey, 0, 4);
    
    const timestamps = await redis.lRange(redisKey, 0, -1);
    
    const data = {
      examId: exam.examId,
      courseCode: exam.courseCode,
      courseTitle: exam.courseTitle,
      questions: exam.questions,
      level: exam.level
    };
    
    if (timestamps.length < 2) {
      session.endSession();
      return sendJson(res, 200, true, 'Exam retrieved successfully', data);
    }
    
    const oldestRequestTime = new Date(timestamps[timestamps.length - 1]);
    const newestRequestTime = new Date(timestamps[0]);
    const timeIntervalMs = newestRequestTime - oldestRequestTime;
    
    let flaggedSuspicious = false;
    
    if (timeIntervalMs < SUSPICIOUS_THRESHOLD_MS) {
      flaggedSuspicious = true;
      await redis.set(`flag:suspicious:${student.userId}:${exam.examId}`, 'true', { EX: 86400 });
    }
    
    // Start transaction here
    await session.withTransaction(async () => {
      // Check submission for late submission flagging & grading update
      const existingSubmission = await Submission.findOne({ student: student._id, exam: exam._id }).session(session);
      
      if (existingSubmission) {
        const submittedAfterEnd = existingSubmission.createdAt > endTime;
        if (submittedAfterEnd) {
          const user = await User.findOne({ userId: student.userId, role: 'Student' }).session(session);
          
          let updated = false;
          for (const resObj of user.results) {
            if (resObj.courseCode === exam.courseCode && resObj.grade !== 'F') {
              resObj.score = 0;
              resObj.grade = 'F';
              updated = true;
              break;
            }
          }
          
          if (updated) {
            await user.save({ session });
          }
        }
      }
    });
    
    session.endSession();
    
    return sendJson(res, 200, true, 'Exam retrieved successfully', {
      data,
      flaggedSuspicious,
      timeIntervalMs,
      SUSPICIOUS_THRESHOLD_MS,
    });
  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    logError('Error in GetExam:', error);
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};