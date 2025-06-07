module.exports.isPasswordComplex = (password) => {
	const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
	return regex.test(password);
};

module.exports.sendJson = (res, status, success, message, data = null) => {
	const response = {
		success,
		message,
		...(data && { data })
	};
	return res.status(status).json(response);
};

module.exports.obfuscateEmail = function(email) {
	const [local, domain] = email.split('@');
	const maskedLocal = local.slice(0, 4) + '****';
	return `${maskedLocal}@${domain}`;
}

module.exports.validateInput = (input = '') => {
	// Check if input is undefined or null
	if (!input && input !== '') {
		return false;
	}
	
	// Convert input to string if it's an object or number
	let stringInput;
	if (typeof input === 'object' && input !== null) {
		try {
			stringInput = JSON.stringify(input);
		} catch (e) {
			// If JSON.stringify fails (e.g., circular reference), treat as invalid
			return false;
		}
	} else {
		stringInput = String(input);
	}
	
	// Trim and check if empty
	if (!stringInput.trim()) {
		return false;
	}
	
	// Check length constraints (adjust these as needed)
	const MIN_LENGTH = 1;
	const MAX_LENGTH = 100; // Adjust based on your requirements
	if (stringInput.length < MIN_LENGTH || stringInput.length > MAX_LENGTH) {
		return false;
	}
	
	// Improved regex pattern that allows Unicode characters
	// This includes emojis, special characters, and international characters
	// Excludes control characters and other potentially dangerous characters
	const SAFE_INPUT_PATTERN = /^[\p{L}\p{N}\p{P}\p{S}\p{Emoji}\p{Emoji_Component}\s]+$/u;
	
	return SAFE_INPUT_PATTERN.test(stringInput.trim());
};

module.exports.logError = (message = '', error = '') => console.error(message, error);

function generateRandomString(length = 0, charset = '') {
	return Array.from({ length }, () => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
}

module.exports.generate = function(long = 8) {
	return generateRandomString(long, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
}

module.exports.isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

module.exports.userData = (user) => {
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


module.exports.validateCourseInput = (course) => {
	const requiredFields = ['courseTitle', 'courseCode', 'units', 'level', 'session', 'semester'];
	const validLevels = ['100lvl', '200lvl', '300lvl', '400lvl'];
	const validSemesters = ['First', 'Second'];
	const sessionRegex = /^\d{4}\/\d{4}$/;
	
	for (const field of requiredFields) {
		if (!course[field]) return `${field} is required`;
	}
	
	if (typeof course.courseTitle !== 'string' || course.courseTitle.trim() === '')
		return 'Invalid courseTitle';
	
	if (!/^[A-Z0-9]+$/.test(course.courseCode))
		return 'Invalid courseCode: must be uppercase alphanumeric';
	
	if (typeof course.units !== 'number' || course.units < 1 || course.units > 6)
		return 'Invalid units: must be between 1 and 6';
	
	if (!validLevels.includes(course.level))
		return `Invalid level: must be one of ${validLevels.join(', ')}`;
	
	if (!sessionRegex.test(course.session))
		return 'Invalid session: must match YYYY/YYYY format';
	
	if (!validSemesters.includes(course.semester))
		return `Invalid semester: must be "First" or "Second"`;
	
	return null;
};


const allowedLevels = ['100lvl', '200lvl', '300lvl', '400lvl'];

module.exporta.validateDepartmentInput = function(data) {
	const errors = [];
	
	if (data.name || data.code) {
		errors.push('Action denied: you cannot change department name or code');
	}
	
	if (data.faculty && typeof data.faculty !== 'string') {
		errors.push('Invalid  faculty');
	}
	
	if (data.coursesPerLevel && typeof data.coursesPerLevel === 'object') {
		for (const level of Object.keys(data.coursesPerLevel)) {
			if (!allowedLevels.includes(level)) {
				errors.push(`Invalid course level: ${level}`);
			} else if (!Array.isArray(data.coursesPerLevel[level])) {
				errors.push(`Courses for ${level} must be an array`);
			} else {
				for (const course of data.coursesPerLevel[level]) {
					if (
						!course.title ||
						typeof course.title !== 'string' ||
						!course.code ||
						typeof course.code !== 'string'
					) {
						errors.push(`Invalid course in ${level}: title and code are required strings`);
					}
				}
			}
		}
	}
	
	return errors;
}

module.exports.trimBody = function(body) {
	return String(body).trim()
}