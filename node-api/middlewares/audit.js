const AuditLog = require('../models/Audit.js');

const auditMiddleware = function(req, res, next) {
	const originalJson = res.json;

	res.json = function(data) {
		const logData = {
			user: req.session?.user?.userId || null, // Safe access
			action: req.path,
			ipAddress: req.ip,
			userAgent: req.get('User-Agent'),
			status: res.statusCode < 400 ? 'success' : 'failure',
			details: { responseData: data }
		};

		// Non-blocking audit log
		AuditLog.create(logData).catch(error => {
			console.error('Error logging audit action:', error);
		});

		// Call original json method
		originalJson.call(this, data);
	};

	next();
};





const logAuditAction = async function(userId, action, ipAddress, userAgent, status, details) {
	try {
		await AuditLog.logAction({
			userId: userId || null,
			action,
			ipAddress,
			userAgent,
			status,
			details
		});
	} catch (error) {
		console.error('Error logging audit action:', error);
	}
};




module.exports = {
	auditMiddleware,
	logAuditAction
};