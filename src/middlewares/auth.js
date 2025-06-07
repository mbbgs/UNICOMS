require('dotenv').config();
const jwt = require("jsonwebtoken");
const { sendJson } = require('../utils/helpers.js');

const MAX_AGE = 1000 * 60 * 60 * 24; // 1day

// Utility to detect if request expects JSON (API) or not (browser)
const isApiRequest = (req) => {
  return req.xhr || req.accepts(['json', 'html']) === 'json';
};

/**
 * Helper to verify JWT token safely.
 * Returns decoded payload if valid, otherwise null.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Extract user info from JWT Bearer token in Authorization header.
 * Returns decoded payload or null.
 */
const extractUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return verifyToken(token);
};

/**
 * Middleware to check if JWT token is valid and not expired.
 * Attaches decoded user info to req.user if valid.
 * If no token or invalid token, just calls next() without error.
 * (Change behavior if you want to force auth on all routes using this)
 */
const sessionMiddlewareJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // No token, continue without error here
  }
  
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please login again." });
  }
  
  // Attach user info for downstream middleware/routes
  req.user = decoded;
  
  next();
};

/**
 * Middleware to require admin permission from JWT payload.
 */
const requireAdminPerm = (req, res, next) => {
  try {
    const user = extractUserFromToken(req);
    const apiRequest = isApiRequest(req);
    
    if (!user) {
      if (apiRequest) return sendJson(res, 401, false, 'User is not logged in');
      return res.status(401).end();
    }
    
    if (!user.hasAdminPermission) {
      if (apiRequest) return sendJson(res, 403, false, 'Action denied');
      return res.status(403).end();
    }
    
    req.user = user; // attach for downstream handlers
    next();
  } catch (error) {
    console.error("Error validating user:", error);
    if (isApiRequest(req)) {
      return sendJson(res, 500, false, 'Internal Server Error');
    }
    return res.status(500).end();
  }
};

/**
 * Middleware to require super admin permissions from JWT payload.
 */
const requireSAAuth = (req, res, next) => {
  try {
    const user = extractUserFromToken(req);
    const apiRequest = isApiRequest(req);
    
    if (!user) {
      if (apiRequest) return sendJson(res, 401, false, 'Please login to continue');
      return res.status(401).end();
    }
    
    if (!user.hasAdminPermission || !user.isSuperAdmin) {
      if (apiRequest) return sendJson(res, 403, false, 'Action denied');
      return res.status(403).end();
    }
    
    // Check token max age based on issued at timestamp (iat)
    const now = Math.floor(Date.now() / 1000);
    if (now - user.iat > MAX_AGE / 1000) {
      if (apiRequest) return sendJson(res, 401, false, 'Session expired. Please login again');
      return res.status(401).end();
    }
    
    req.user = user; // attach for downstream handlers
    next();
  } catch (error) {
    console.error('Error validating super admin auth:', error);
    if (isApiRequest(req)) {
      return sendJson(res, 500, false, 'Internal server error');
    }
    return res.status(500).end();
  }
};

/**
 * Middleware to ensure user is logged in.
 * Assumes req.user is attached by earlier middleware.
 */
const requireLogin = (req, res, next) => {
  try {
    if (!req?.user) {
      return sendJson(res, 401, false, 'Login to proceed');
    }
    next();
  } catch (error) {
    console.error("Login check failed:", error);
    return sendJson(res, 500, false, 'Server error');
  }
};

module.exports = {
  sessionMiddlewareJWT,
  requireAdminPerm,
  requireSAAuth,
  requireLogin,
};