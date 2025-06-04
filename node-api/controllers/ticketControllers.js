const Ticket = require('../models/Ticket.js');
const User = require('../models/User.js');
const {
  sendJson,
  logError,
  generate,
  isNonEmptyString
} = require('../utils/helpers.js')


const validStatus = ['open', 'in_progress', 'resolved', 'closed'];
const validPriority = ['low', 'medium', 'high', 'urgent'];
const validTypes = ['course_issue', 'exam_issue', 'technical', 'general'];




// CREATE
module.exports.createTicket = async (req, res) => {
  try {
    const { title, description, studentId, course, exam, priority, type } = req.body;
    
    // Validation
    if (!isNonEmptyString(title)) return sendJson(res, 400, false, 'Title is required')
    
    if (!isNonEmptyString(description)) return sendJson(res, 400, false, 'Description is required');
    if (!isNonEmptyString(studentId)) return sendJson(res, 400, false, 'Invalid student ID');
    
    if (priority && !validPriority.includes(priority)) return sendJson(res, 400, false, 'Invalid priority');
    if (type && !validTypes.includes(type)) return sendJson(res, 400, false, 'Invalid type')
    
    
    const isUser = await User.findOne({ userId: String(studentId).trim(), role: 'Student' })
    
    if (!isUser) return sendJson(res, 404, false, 'Student does not exist')
    
    const ticket = new Ticket({
      ticketId: generate(7),
      title: title.trim(),
      description: description.trim(),
      student: isUser._id,
      priority: priority || 'medium',
      type: type || 'general'
    });
    
    await ticket.save();
    return sendJson(res, 201, true, 'Ticket created successfully')
  } catch (error) {
    logError('Error generating ticket', error)
    return sendJson(res, 500, false, 'Internal Server Error')
  }
};

// GET ALL
module.exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate({ path: 'student', select: '-password -_id -isSuperAdmin -hasAdminPermission -email' })
      .populate('course')
      .populate('exam')
      .populate({ path: 'resolvedBy', select: '-password -_id -isSuperAdmin -hasAdminPermission' });
    
    return sendJson(res, 200, true, 'Tickets fetched successfully', tickets);
  } catch (err) {
    logError('Error getting all tickets', error)
    return sendJson(res, 500, false, 'Internal Server Error')
  }
};

// READ ONE
module.exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isNonEmptyString(id)) {
      return sendJson(res, 400, false, 'Invalid ticket ID');
    }
    
    const ticket = await Ticket.findOne({ ticketId: id })
      .populate({ path: 'student', select: '-password -_id -isSuperAdmin -hasAdminPermission -email' })
      .populate('course')
      .populate('exam')
      .populate({ path: 'resolvedBy', select: '-password -_id -isSuperAdmin -hasAdminPermission' });
    
    
    if (!ticket) {
      return sendJson(res, 404, false, 'Ticket not found');
    }
    
    return endJson(res, 200, true, 'Ticket fetched successfully', ticket);
  } catch (error) {
    logError('Error getting ticket', error)
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};


// UPDATE
module.exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isNonEmptyString(id)) {
      return sendJson(res, 400, false, 'Invalid ticket ID');
    }
    
    const updates = {};
    const allowed = ['title', 'description', 'status', 'priority', 'type', 'response'];
    
    for (let key of allowed) {
      if (req.body[key] !== undefined) {
        let value = req.body[key];
        
        if (typeof value === 'string') value = value.trim();
        
        if (['title', 'description', 'response'].includes(key) && !isNonEmptyString(value)) {
          return sendJson(res, 400, false, `Invalid ${key}`);
        }
        
        if (key === 'status' && !validStatus.includes(value)) {
          return sendJson(res, 400, false, 'Invalid status');
        }
        
        if (key === 'priority' && !validPriority.includes(value)) {
          return sendJson(res, 400, false, 'Invalid priority');
        }
        
        if (key === 'type' && !validTypes.includes(value)) {
          return sendJson(res, 400, false, 'Invalid type');
        }
        
        updates[key] = value;
      }
    }
    
    const updated = await Ticket.findOneAndUpdate({ ticketId: id }, updates, {
      new: true,
      runValidators: true
    });
    
    if (!updated) {
      return sendJson(res, 404, false, 'Ticket not found');
    }
    
    return sendJson(res, 200, true, 'Ticket updated successfully');
  } catch (error) {
    logError('Error updating ticket', error)
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};

// DELETE
module.exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isNonEmptyString(id)) {
      return sendJson(res, 400, false, 'Invalid ticket ID');
    }
    
    const deleted = await Ticket.findOneAndDelete({ ticketId: id });
    if (!deleted) {
      return sendJson(res, 404, false, 'Ticket not found');
    }
    
    return sendJson(res, 200, true, 'Ticket deleted successfully');
  } catch (error) {
    logError('Error deleting ticket', error)
    return sendJson(res, 500, false, 'Internal Server Error');
  }
};