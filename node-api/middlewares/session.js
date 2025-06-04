const { sendJson } = require('../utils/helpers.js');
const User = require('../models/User.js');

const TOUCH_AFTER_TIME = 3600 * 1000; // 1h 5min
const MAX_AGE = 3600 * 1000; // 1hr 5min 

/**
 * Basic login requirement check
 */
const requireLogin = (req, res, next) => {
  if (!req.session?.user) {
    return sendJson(res, 401, false, 'Login to proceed')
  }
  next();
};


/**
 * Main session management middleware
 */
const sessionMiddleware = function(req, res, next) {
  const now = Date.now();
  
  if (!req.session) {
    return next();
  }
  
  try {
    if (!req.session.createdAt) {
      req.session.createdAt = now;
      req.session.lastAccess = now;
      req.session.browserFingerprint = req.headers['user-agent'];
      return next();
    }
    
    if (now - req.session.createdAt > MAX_AGE) {
      return destroySession(req)
        .then(() => {
          res.clearCookie('unicoms.sid');
          next();
        })
        .catch(error => {
          throw error;
        });
    }
    
    if (now - req.session.lastAccess > TOUCH_AFTER_TIME) {
      return destroySession(req)
        .then(() => {
          res.clearCookie('unicoms.sid');
          next();
        })
        .catch(error => {
          throw error;
        });
    }
    
    req.session.lastAccess = now;
    next();
    
  } catch (error) {
    throw error;
  }
};

/**
 * Save session as Promise
 */
const saveSession = async function(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        console.error('Session save error:', error);
        reject(error);
      }
      resolve();
    });
  });
};

/**
 * Destroy session as Promise
 */
const destroySession = async function(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        console.error('Session destruction error:', error);
        reject(error);
      }
      resolve();
    });
  });
};

/**
 * Helper to detect API requests
 */
const isApiRequest = (req) => {
  return req.xhr || req.accepts(['json', 'html']) === 'json'
};


/**
 * admin permission authentication middleware
 * Handles both browser and API requests
 */

const requireAdminPerm = async function(req, res, next) {
  try {
    const user = req.session?.user;
    const apiRequest = isApiRequest(req);
    const currentPath = req.path;
    
    // Handle missing user session
    if (!user) {
      if (apiRequest) {
        return sendJson(res, 401, false, 'User is not logged in');
      }
      return res.status(400).end()
    }
    
    
    // Handle unverified user
    const { hasAdminPermission } = user;
    
    if (!hasAdminPermission) {
      if (apiRequest) {
        return sendJson(res, 403, false, 'Action denied');
      }
      return res.status(400).end()
    }
    
    next();
  } catch (error) {
    console.error("Error validating user:", error);
    if (isApiRequest(req)) {
      return sendJson(res, 500, false, 'Internal Server Error');
    }
    return res.status(500).end()
  }
};


/**
 * super admin authentication middleware
 */
const requireSAAuth = async function(req, res, next) {
  try {
    const user = req.session?.user;
    const apiRequest = isApiRequest(req);
    const createdAt = new Date(user?.createdAt);
    const now = Date.now();
    
    // Check if session exists
    if (!user) {
      if (apiRequest) {
        return sendJson(res, 401, false, 'Please login to continue');
      }
      return res.status(401).end();
    }
    // Handle unverified user
    const { hasAdminPermission, isSuperAdmin } = user;
    
    if (!hasAdminPermission) {
      if (apiRequest) {
        return sendJson(res, 403, false, 'Action denied');
      }
      return res.status(400).end()
    }
    
    if (!isSuperAdmin) {
      if (apiRequest) {
        return sendJson(res, 403, false, 'Action denied');
      }
      return res.status(400).end()
    }
    
    if (now - createdAt > MAX_AGE) {
      return destroySession(req)
        .then(() => {
          res.clearCookie('unicoms.sid');
          next();
        })
        .catch(error => {
          throw error;
        });
      if (apiRequest) {
        return sendJson(res, 401, false, 'Session expired. Please login again');
      }
      return res.status(401).end();
    }
    
    next();
  } catch (error) {
    console.error('Error validating super admin session:', error);
    if (isApiRequest(req)) {
      return sendJson(res, 500, false, 'Internal server error');
    }
    return res.status(401).end()
  }
};




module.exports = {
  saveSession,
  requireLogin,
  destroySession,
  requireSAAuth,
  requireAdminPerm,
  sessionMiddleware,
};