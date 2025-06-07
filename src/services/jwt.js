require("dotenv").config();
const jwt = require("jsonwebtoken");
const { sendJson } = require('../utils/helpers');

// Constants
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const MAX_AGE_MS = 1000 * 60 * 60 * 24; // 1day

if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in environment");


// Sign a token
const signToken = (payload = {}) => {
  if (typeof payload !== 'object') throw new Error("Payload must be an object");
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};


// Safely verify a token and return metadata
const verifyToken = (token) => {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Missing or malformed token" };
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (err) {
    return {
      valid: false,
      reason: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    };
  }
};


// Check if request is an API call
const isApiRequest = (req) =>
  req.xhr || req.accepts(['json', 'html']) === 'json';


// Middleware: Require valid token
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return sendJson(res, 401, false, "Missing Authorization header");
  }
  
  const token = authHeader.split(" ")[1];
  const { valid, payload, reason } = verifyToken(token);
  
  if (!valid) return sendJson(res, 401, false, reason);
  
  req.user = payload;
  next();
};


// Middleware: Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return sendJson(res, 403, false, "Access denied");
    }
    next();
  };
};


// Middleware: Require admin permissions
const requireAdminPerm = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiRequest = isApiRequest(req);
  
  if (!authHeader?.startsWith("Bearer ")) {
    return apiRequest ?
      sendJson(res, 401, false, "Missing Authorization header") :
      res.status(401).end();
  }
  
  const token = authHeader.split(" ")[1];
  const { valid, payload, reason } = verifyToken(token);
  
  if (!valid) {
    return apiRequest ?
      sendJson(res, 401, false, reason) :
      res.status(401).end();
  }
  
  if (!payload.hasAdminPermission) {
    return apiRequest ?
      sendJson(res, 403, false, "Admin permission required") :
      res.status(403).end();
  }
  
  req.user = payload;
  next();
};


// Middleware: Require Super Admin permissions
const requireSAAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiRequest = isApiRequest(req);
  
  if (!authHeader?.startsWith("Bearer ")) {
    return apiRequest ?
      sendJson(res, 401, false, "Missing Authorization header") :
      res.status(401).end();
  }
  
  const token = authHeader.split(" ")[1];
  const { valid, payload, reason } = verifyToken(token);
  
  if (!valid) {
    return apiRequest ?
      sendJson(res, 401, false, reason) :
      res.status(401).end();
  }
  
  const { hasAdminPermission, isSuperAdmin, iat } = payload;
  
  if (!hasAdminPermission || !isSuperAdmin) {
    return apiRequest ?
      sendJson(res, 403, false, "Super Admin permission required") :
      res.status(403).end();
  }
  
  const now = Date.now();
  const issuedAt = iat * 1000;
  
  if (now - issuedAt > MAX_AGE_MS) {
    return apiRequest ?
      sendJson(res, 401, false, "Token expired. Please login again.") :
      res.status(401).end();
  }
  
  req.user = payload;
  next();
};


module.exports = {
  signToken,
  verifyToken,
  requireAuth,
  restrictTo,
  requireAdminPerm,
  requireSAAuth,
};