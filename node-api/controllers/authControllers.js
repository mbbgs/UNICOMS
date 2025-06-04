const mongoose = require('mongoose')
const User = require('../models/User.js')
const Course = require('../models/Course.js')
const Department = require('../models/Department.js')
const Exam = require('../models/Exam.js')
const Otp = require('../models/Otp.js')



const {
  logError,
  generate,
  isPasswordComplex,
  sendJson,
  validateInput: isValidInput
} = require('../utils/helpers.js')

const { hashToken: hashPassword, verifyToken: comparePassword } = require('../services/Scrypt.js')
const { saveSession, destroySession } = require('../middlewares/session.js')
const constants = require('../constants.js')




module.exports.CreateAccount = async function(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { otherNames = '', firstName = '', username = '', password = '', role = '' } = req.body;
    
    if (
      !isValidInput(username.trim()) ||
      !isValidInput(otherNames.trim()) ||
      !isValidInput(firstName.trim()) ||
      !isValidInput(password.trim())
    ) {
      return sendJson(res, 400, false, 'Provide valid credentials to proceed');
    }
    
    if (!isPasswordComplex(password.trim())) {
      return sendJson(res, 400, false, 'Password must be complex, try again');
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ username }).session(session);
    if (existingUser) {
      return sendJson(res, 409, false, 'Username already taken');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password.trim());
    
    // Create user
    const user = new User({
      firstName,
      otherNames,
      userId: generate(11),
      username: username.trim(),
      password: hashedPassword,
      role: role.trim()
    });
    
    await user.save({ session });
    
    await session.commitTransaction();
    return sendJson(res, 201, true, 'Account created successfully,login to access the dashboard');
    
  } catch (e) {
    await session.abortTransaction();
    logError('Account creation failed:', e);
    return sendJson(res, 500, false, 'Internal server error');
  } finally {
    session.endSession();
  }
}

//generate invitation code to permit @hasAdminPermission
module.exports.GenerateIC = async function(req, res) {
  const user = req.session?.user
  if (!user) {
    return sendJson(res, 401, false, 'You are not authenticated')
  }
  
  const session = mongoose.startSession()
  session.startTransaction()
  try {
    const { userId = '' } = req.body
    if (!isValidInput(userId.trim())) return sendJson(res, 400, false, 'invalid request')
    
    const isUser = await User.findOne({ userId: String(userId).trim(), role: 'Admin', hasAdminPermission: false })
    if (!isUser) return sendJson(res, 403, false, 'Action denied')
    
    const { success, status, message, plain } = await Otp.generateOtp(isUser._id, { session })
    if (!success) return sendJson(res, status, message)
    
    await session.commitTransaction();
    return sendJson(res, 201, true, 'Invitation code generated', plain);
    
  } catch (error) {
    await session.abortTransaction()
    logError('Error generating invitation code')
    return sendJson(res, 500, false, 'Internal Server Error')
  } finally {
    session.endSession()
  }
}


// verify token invitation code 
module.exports.VerifySU = async function(req, res) {
  
  try {
    const { userId = '', token = '' } = req.params;
    
    
    if (!isValidInput(token.trim()) || !isValidInput(userId.trim())) {
      return sendJson(res, 400, false, 'invalid tokens')
    }
    
    const isUser = await User.findOne({ userId: String(userId).trim(), hasAdminPermission: false, role: 'Admin' })
    if (!isUser) return sendJson(res, 403, false, 'Action denied');
    
    const { success, message, status, userId } = Otp.VerifyOtp(userId?.trim(), token?.trim())
    if (!success) return sendJson(res, status, message);
    
    isUser.hasAdminPermission = true;
    await isUser.save();
    
    return sendJson(res, 200, true, 'admin privilege given')
  } catch (error) {
    logError('Admin verification failed', error)
    return sendJson(res, 500, false, 'Internal Server Error ')
  }
}

module.exports.userLogin = async function(req, res) {
  
  try {
    const { username = '', password = '' } = req.body;
    
    
    // Validate input
    if (!isValidInput(username.trim()) || !isValidInput(password.trim())) {
      return sendJson(res, 401, false, 'wrong username or password');
    }
    
    const isUser = await User.findOne({ username: username.trim() });
    if (!isUser) {
      return sendJson(res, 401, false, 'wrong username and password');
    }
    
    
    // Compare password
    const isMatched = await comparePassword(password.trim(), isUser.password);
    if (!isMatched) {
      return sendJson(res, 401, false, 'wrong username or password');
    }
    
    const token = crypto.randomBytes(16).toString('hex');
    
    const sessionData = {
      token,
      username: isUser.username,
      userId: isUser.userId,
      lastLogin: new Date(),
      hasAdminPermission: isUser.hasAdminPermission,
      isSuperAdmin: isUser.isSuperAdmin,
      lastAccess: new Date()
    };
    
    
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          reject(err);
        } else {
          // Set user data on new session
          req.session.user = sessionData;
          resolve();
        }
      });
    });
    
    // Save the session
    await saveSession(req);
    
    return sendJson(res, 200, true, 'Login successful', {
      username: isUser.username,
      user_type: isUser.role,
      token: token
    });
    
  } catch (error) {
    logError('Error logging in user', error);
    return sendJson(res, 500, false, 'Internal server error occurred');
  }
};


module.exports.getUserProfile = async function(req, res) {
  try {
    const user = req.session?.user;
    if (!user) {
      return sendJson(res, 401, false, 'You are not authenticated')
    }
    const isUser = await User.findOne({ userId: user?.userId, role: user.role })
    if (!isUser) {
      return sendJson(res, 404, false, 'user not found')
    }
    
    const getData = studentData(isUser)
    return sendJson(res, 200, true, 'user profile', {
      ...getData
    })
  } catch (error) {
    logError('Error getting user profile', error)
    return sendJson(res, 500, false, 'Internal server error occurred')
  }
}


module.exports.logoutUser = async function(req, res) {
  try {
    const user = req.session?.user
    if (!user) {
      return sendJson(res, 401, false, 'You are not authenticated')
    }
    
    await destroySession(req);
    
    res.clearCookie('unicoms.sid');
    res.setHeader('Clear-Site-Data', '"cache","cookies","storage"');
    return sendJson(res, 200, true, 'Logged out successfully')
  } catch (error) {
    logError('Error clearing user cookies', error)
    return sendJson(res, 500, false, 'Internal server error occurred')
  }
}


const UserData = (user) => {
  return {
    username: user.username || '',
    firstName: user.firstName,
    otherNames: user.otherNames,
    level: user.level,
    registeredCourses: user.registeredCourses || [],
    results: user.results || [],
    department: user.department || '',
    faculty: user.faculty || '',
    matric: user.matric || ''
  }
}