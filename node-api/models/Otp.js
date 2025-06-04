const mongoose = require('mongoose')
const { verifyToken: verifyOtp, hashToken: hashOtp } = require('../services/Scrypt.js');
const { generate: generateOtp } = require('../utils/helpers.js')


const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  hashed: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    index: true
  },
  isUsed: { type: Boolean, default: false }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
});


otpSchema.index({ createdAt: 1 }, { expiresAfterSeconds: 600 }); //10min


/**

otpSchema.statics.generateOtp = async function(userId) {
  try {
    if (!userId) {
      return { success: false, status: 400, message: "Missing parameters", plain: null };
    }
    
    await this.deleteMany({ userId, isUsed: false });
    
    const plain = generateOtp(6);
    const hashed = await hashOtp(plain);
    
    const otp = await this.create({ userId, hashed });
    
    if (!otp) {
      return { success: false, status: 500, message: "Error creating Otp", plain: null };
    }
    
    return { success: true, status: 200, message: "Otp created successfully", plain: plain };
  } catch (error) {
    console.error('Error generating Otp:', error);
    return { success: false, status: 500, message: "Internal Error Occurred", plain: null };
  }
};
***/
otpSchema.statics.generateOtp = async function(userId, option = {}) {
  try {
    if (!userId) {
      return { success: false, status: 400, message: "Missing parameters", plain: null };
    }
    
    await this.deleteMany({ userId, isUsed: false });
    
    const plain = generateOtp(11);
    const hashed = await hashOtp(plain);
    
    const otp = await this.create([userId, hashed}], option);
  
  if (!otp) {
    return { success: false, status: 500, message: "Error creating Otp", plain: null };
  }
  
  return { success: true, status: 200, message: "Otp created successfully", plain: plain };
} catch (error) {
  console.error('Error generating Otp:', error);
  return { success: false, status: 500, message: "Internal Error Occurred", plain: null };
}

};



otpSchema.statics.verifyOtp = async function(userId, otp) {
  try {
    if (!otp || !userId) {
      return { success: false, status: 400, message: "Missing parameters" };
    }
    
    const otpDoc = await this.findOne({ userId, isUsed: false })
      .populate('userId', 'role _id')
      .sort({ createdAt: -1 });
    
    if (!otpDoc) {
      return { success: false, status: 404, message: "Invalid or expired otp" };
    }
    
    const otpUserId = otpDoc.userId._id.toString();
    
    if (userId._id.toString() !== otpUserId) {
      return {
        success: false,
        status: 403,
        message: 'permission denied',
        
      }
    }
    
    
    const isValid = await verifyOtp(otp, otpDoc.hashed);
    if (!isValid) {
      return { success: false, status: 400, message: "Invalid otp" };
    }
    
    otpDoc.isUsed = true;
    await otpDoc.save();
    
    return {
      success: true,
      status: 200,
      message: "Otp verified successfully",
      userId: otpUserId
    };
  } catch (error) {
    console.error('Error verifying otp:', error);
    return { success: false, status: 500, message: "Internal error occurred" };
  }
};

module.exports = mongoose.model('Otp', otpSchema)