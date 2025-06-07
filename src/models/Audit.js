const mongoose = require('mongoose');


const apiAuditSchema = new mongoose.Schema({
  user: {
    type:String,
    index: true,
    default: null
  },
  action: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: () => new Date().toISOString()
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});


apiAuditSchema.index({ action: 1, createdAt: -1 });

apiAuditSchema.statics.logAction = async function(logData = {}) {
  try {
    return await this.create(logData);
  } catch (error) {
    console.error('Error logging action in Audit Model', error)
    throw error
  }
};

module.exports = mongoose.model('Audit', apiAuditSchema);