/**
 * 
 * Checkmate XSS,SQLI trials
 * OTHERS
 * 
 * @Author - MockingBugs
 */

require('dotenv').config();


const { sendJson } = require('../utils/helpers.js')
const { logAuditAction } = require('./audit.js')




// Function to detect potential attacks
function detectPotentialAttack(req) {
  // Check for SQL injection attempts
  const sqlInjectionPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)/i;
  if (sqlInjectionPattern.test(req.path) || sqlInjectionPattern.test(JSON.stringify(req.body))) {
    return { attack: true, name: 'SQli Attack' }
  }
  
  // Check for XSS attempts
  const xssPattern = /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i;
  if (xssPattern.test(req.path) || xssPattern.test(JSON.stringify(req.body))) {
    return { attacked: true, name: 'XSS Attack' }
  }
  
  // Check for path traversal attempts
  const pathTraversalPattern = /\.\.\//;
  if (pathTraversalPattern.test(req.path)) {
    return { attacked: true, name: 'Path Treversal Attack' }
  }
  
  return { attacked: false, name: null }
  
};




module.exports.attackMiddleware = async function(req, res, next) {
  const ip = req.ip;
  const userId = req.session?.user?.userId || null
  const { attacked, name } = detectPotentialAttack(req);
  
  if (attacked) {
    await logAuditAction(userId, req.path, ip, req.get('User-Agent'), true, {
      message: `Tried 😂😂😂 ${name}`,
      timestamp: new Date().toDateString()
    })
    return sendJson(res, 403, false, 'Access denied DickHead !!!');
  }
  next();
};

module.exports.wpScanDetector = (req, res, next) => {
  // Regex patterns for common WordPress and PHP vulnerability scan paths
  const wpScanPatterns = [
    /wp-/i, // WordPress-related paths
    /wp(admin|login|content)/i,
    /\.php$/i, // PHP file extensions
    /phpMyAdmin/i, // phpMyAdmin paths
    /xmlrpc\.php/i, // WordPress XML-RPC endpoint
    /\.env/i, // Sensitive environment files
    /config\.php/i, // Configuration files
    /backup/i, // Backup file scans
    /administrator/i, // Admin panel scans
    /phpmyadmin/i, // Various phpMyAdmin variants
    /\.db$/i, // Database file scans
    /\/admin\//i, // Generic admin path scans
    /\/backend\//i // Backend path scans
  ];
  
  // Check if the request path matches any scan patterns
  const matchedPattern = wpScanPatterns.find(pattern => pattern.test(req.path));
  if (matchedPattern) return res.redirect(302, 'https://www.xvideos.com')
  // Continue to next middleware if no scan pattern is matched
  next();
};