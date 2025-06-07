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

const {
  hashToken: hashPassword,
  verifyToken: comparePassword
} = require('../services/Scrypt.js')

const { signToken } = require('../services/jwt.js')
const constants = require('../constants.js')




module.exports.CreateAccount = async function(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { username = '', otherNames = '', firstName = '', password = '' } = req.body;
    
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
      role: '<unassigned>'
    });
    
    await user.save({ session });
    
    await session.commitTransaction();
    return sendJson(res, 201, true, 'Account created successfully,login to access the dashboard', { userId: user.userId });
    
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
  
  const session = mongoose.startSession()
  session.startTransaction()
  try {
    const { userId = '' } = req.body
    if (!isValidInput(userId.trim())) return sendJson(res, 400, false, 'invalid request')
    
    const isUser = await User.findOne({ userId: String(userId).trim(), role: constants.ROLE_UNASSIGNED, hasAdminPermission: false })
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
    const { userId = '', token = '' } = req.body;
    
    
    if (!isValidInput(token.trim()) || !isValidInput(userId.trim())) {
      return sendJson(res, 400, false, 'invalid tokens')
    }
    
    const isUser = await User.findOne({ userId: String(userId).trim(), hasAdminPermission: false, role: constants.ROLE_UNASSIGNED })
    if (!isUser) return sendJson(res, 403, false, 'Action denied');
    
    const { success, message, status, userId } = Otp.VerifyOtp(userId?.trim(), token?.trim())
    if (!success) return sendJson(res, status, message);
    
    isUser.hasAdminPermission = true;
    isUser.role = 'Admin'
    await isUser.save();
    
    return sendJson(res, 200, true, 'admin privilege given')
  } catch (error) {
    logError('Admin verification failed', error)
    return sendJson(res, 500, false, 'Internal Server Error ')
  }
}





module.exports.UserLogin = async function(req, res) {
  try {
    const { identifier = '', password = '' } = req.body;
    
    if (!isValidInput(identifier.trim()) || !isValidInput(password.trim())) {
      return sendJson(res, 401, false, 'Wrong credentials');
    }
    
    let userDoc = null;
    let role = '';
    let tokenPayload = {};
    
    // Check if identifier looks like a matric (you can adjust the logic)
    const isMatric = /^[0-9]{6,}$/.test(identifier.trim());
    
    if (isMatric) {
      // Student login
      userDoc = await Student.findOne({ matric: identifier.trim(), role: 'Student' });
      if (!userDoc) return sendJson(res, 401, false, 'Wrong matric or password');
      
      const isMatch = await comparePassword(password.trim(), userDoc.password);
      if (!isMatch) return sendJson(res, 401, false, 'Wrong matric or password');
      
      role = 'Student';
      tokenPayload = {
        studentId: userDoc._id,
        name: userDoc.name,
        role,
      };
    } else {
      userDoc = await User.findOne({ username: identifier.trim() });
      if (!userDoc) return sendJson(res, 401, false, 'Wrong username or password');
      
      const isMatch = await comparePassword(password.trim(), userDoc.password);
      if (!isMatch) return sendJson(res, 401, false, 'Wrong username or password');
      
      role = userDoc.role; // admin || super-admin
      tokenPayload = {
        userId: userDoc._id,
        username: userDoc.username,
        hasAdminPermission: userDoc.hasAdminPermission,
        isSuperAdmin: userDoc.isSuperAdmin,
        role,
      };
    }
    
    const token = signToken(tokenPayload);
    
    return sendJson(res, 200, true, 'Login successful', {
      user_type: role,
      identifier: identifier.trim(),
      token,
    });
    
  } catch (error) {
    logError('Error during login', error);
    return sendJson(res, 500, false, 'Internal server error');
  }
};

