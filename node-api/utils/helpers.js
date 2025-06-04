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