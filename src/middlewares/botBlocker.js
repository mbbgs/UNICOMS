const crypto = require('crypto');
const ipRangeCheck = require('ip-range-check');

// Enhanced WordPress probe blocker with advanced detection and response
module.exports.blockWordPressProbes = (banner = null) => {
	
	return (req, res, next) => {
		const path = req.path.toLowerCase();
		const fullUrl = req.url.toLowerCase();
		
		// Extensive list of WordPress and vulnerable paths
		const wordPressPaths = [
			// WordPress core paths
			'/wp-admin/',
			'/wp-login.php',
			'/wp-content/',
			'/wp-includes/',
			'/wp-json/',
			'/xmlrpc.php',
			
			// Vulnerable plugin and theme paths
			'/wp-config.php',
			'/wp-config.bak',
			'/wp-config.old',
			'/wp-config.txt',
			'/wp-config.orig',
			'/wp-config-sample.php',
			
			// Common WordPress login and admin paths
			'/admin/',
			'/administrator/',
			'/wp-login/',
			'/login.php',
			'/admin.php',
			
			// Potential WordPress exploit paths
			'/wp-trackback.php',
			'/wp-comments-post.php',
			'/wp-signup.php',
			'/wp-cron.php',
			
			// Manifest and other probed files
			'/manifest.json',
			'/manifest.webapp',
			'/manifest.xml',
			
			// Ajax and admin-related probes
			'/ajax-admin.php',
			'/ajax-admin.html',
			'/wp-admin/admin-ajax.php',
			
			// Other common WordPress vulnerabilities
			'/adminer.php',
			'/phpmyadmin/',
			'/database-admin/',
			'/db-admin/',
			
			// Additional WordPress paths
			'/wp-activate.php',
			'/wp-blog-header.php',
			'/wp-links-opml.php',
			'/wp-load.php',
			'/wp-mail.php',
			'/wp-settings.php',
			'/wp-register.php',
			'/wp-app.php',
			
			// Common plugin paths
			'/wp-content/plugins/',
			'/wp-content/mu-plugins/',
			'/wp-content/themes/',
			'/wp-content/uploads/',
			
			// Known vulnerable plugins
			'/wp-content/plugins/akismet/',
			'/wp-content/plugins/contact-form-7/',
			'/wp-content/plugins/woocommerce/',
			'/wp-content/plugins/wordfence/',
			'/wp-content/plugins/yoast-seo/',
			'/wp-content/plugins/elementor/',
			'/wp-content/plugins/jetpack/',
			'/wp-content/plugins/all-in-one-seo-pack/',
			
			// Installation and upgrade paths
			'/wp-admin/install.php',
			'/wp-admin/setup-config.php',
			'/wp-admin/upgrade.php',
			
			// Common backup and export paths
			'/wp-content/backup-db/',
			'/wp-content/backups/',
			'/wp-content/cache/',
			'/wp-admin/export.php',
			
			// Additional admin interfaces
			'/wp-admin/network/',
			'/wp-admin/user/',
			'/wp-admin/post.php',
			'/wp-admin/edit.php',
			'/wp-admin/options.php',
			
			// Common probing paths
			'/.env',
			'/readme.html',
			'/license.txt',
			'/readme.txt',
			'/robots.txt',
			'/sitemap.xml',
			
			// File manager and uploader paths often exploited
			'/wp-admin/media-new.php',
			'/wp-admin/plugin-install.php',
			'/wp-admin/theme-install.php',
			
			// Web shell paths
			'/shell.php',
			'/cmd.php',
			'/c99.php',
			'/r57.php',
			'/webshell.php',
			'/backdoor.php',
			
			// Alternative admin paths
			'/dashboard/',
			'/control/',
			'/cp/',
			'/backend/',
			'/manage/',
			
			// Install script paths
			'/install/',
			'/setup/',
			'/installer/',
			'/install.php',
			'/setup.php',
			
			// Additional vulnerable paths
			'/.git/',
			'/.svn/',
			'/.htaccess',
			'/.htpasswd',
			'/config.php',
			'/configuration.php',
			'/settings.php',
			
			// Additional high-risk paths
			'/eval.php',
			'/exec.php',
			'/system.php',
			'/passthru.php',
			'/proc/self/environ',
			'/proc/self/cmdline',
		];
		
		// Enhanced regex patterns for more flexible matching
		const wordPressPatterns = [
			/^\/wp-/, // Any path starting with wp-
			/\/wp-(admin|content|includes)\//, // WordPress core directories
			/\/(wordpress|wp)\//, // General WordPress directory
			/\/(admin|login|dashboard)\.php$/, // Admin-like PHP files
			/\.sql$/, // SQL file probes
			/\.bak$/, // Backup file probes
			/^\/\.well-known\//, // Potential configuration probes
			/\.(git|svn|hg|bzr|cvs)\//, // Version control directories
			/\.(zip|tar|gz|rar|7z)$/, // Archive files
			/\.(log|logs)$/, // Log files
			/\/(backup|bak|backup-files|old|new|temp|tmp)\//, // Backup directories
			/\/uploads\/.*\.(php|phtml|php5|php7|phps)$/, // PHP files in uploads
			/\/includes\/.*\.(php|phtml|php5|php7|phps)$/, // PHP files in includes
			/\/(webshell|backdoor|shell|cmd|c99|r57)\./, // Common webshell names
			/\/(phpmyadmin|myadmin|pma|sqladmin|mysql)\//, // Database admin tools
			/\/(cgi|cgi-bin)\//, // CGI directories
			/\.(php|phtml|php5|php7)\/.*\?.*=.*/, // PHP with suspicious query params
			/\/.*\/(wp-config|config|configuration|setup|install|upgrade|update)\.php/, // Config files with directory depth
		];
		
		// Allowed paths with stricter access control
		const allowedPaths = [
			'/transaction/callback',
			'/transaction/callback/'
		];
		
		// Check for direct path matches
		if (wordPressPaths.some(wpPath => path === wpPath || path.startsWith(wpPath))) {
			// Generate unique request identifier
			const requestId = crypto.randomBytes(8).toString('hex');
			
			// Log detailed information
			const logData = {
				requestId,
				timestamp: new Date().toISOString(),
				path: req.path,
				method: req.method,
				ip: req.ip || req.connection.remoteAddress,
				userAgent: req.get('User-Agent'),
				headers: req.headers,
				query: req.query,
				event: 'wordpress_probe_direct_match'
			};
			
			
			console.warn(`[SECURITY] Blocked WordPress probe: ${requestId}`, logData);
			
			// Return misleading response to waste attacker's time
			return res.status(200).send('<html><body><h1>Please wait...</h1><script>setTimeout(function(){window.location.href="/error";}, 3000);</script></body></html>');
		}
		
		// Check for regex pattern matches
		if (wordPressPatterns.some(pattern => pattern.test(path) || pattern.test(fullUrl))) {
			// Generate unique request identifier
			const requestId = crypto.randomBytes(8).toString('hex');
			
			// Log detailed information
			const logData = {
				requestId,
				timestamp: new Date().toISOString(),
				path: req.path,
				method: req.method,
				ip: req.ip || req.connection.remoteAddress,
				userAgent: req.get('User-Agent'),
				headers: req.headers,
				query: req.query,
				event: 'wordpress_probe_pattern_match',
				matchedPattern: wordPressPatterns.find(pattern => pattern.test(path) || pattern.test(fullUrl)).toString()
			};
			
			console.warn(`[SECURITY] Blocked WordPress probe: ${requestId}`, logData);
			
			// Add security headers to mislead scanners
			res.setHeader('X-Frame-Options', 'DENY');
			res.setHeader('X-XSS-Protection', '1; mode=block');
			res.setHeader('X-Content-Type-Options', 'nosniff');
			res.setHeader('Content-Security-Policy', "default-src 'self'");
			
			// Return 404 instead of 403 to confuse scanners
			return res.status(404).send('Not Found');
		}
		
		// Check for allowed paths with strict validation
		if (allowedPaths.includes(path)) {
			// Additional validation for allowed paths
			const validReferers = [
				'https://makeittrend.com'
			];
			
			const referer = req.get('Referer') || '';
			
			// Check if request has valid referer for these special paths
			if (!validReferers.some(valid => referer.startsWith(valid))) {
				// Log suspicious access to allowed paths
				console.warn(`[SECURITY] Invalid referer for allowed path:`, {
					path: req.path,
					method: req.method,
					ip: req.ip || req.connection.remoteAddress,
					userAgent: req.get('User-Agent'),
					referer
				});
				
				// Return 403 for invalid referer
				return res.status(403).end();
			}
			
			return next();
		}
		
		// Enhanced query parameter analysis
		const queryParams = req.url.split('?')[1];
		if (queryParams) {
			// Suspicious parameter detection - expanded list
			const suspiciousParams = [
				'redirect=',
				'return_url=',
				'next=',
				'callback=',
				'file=',
				'r=',
				'page=',
				'cmd=',
				'exec=',
				'command=',
				'action=',
				'do=',
				'load=',
				'process=',
				'view=',
				'template=',
				'theme=',
				'plugin=',
				'func=',
				'function=',
				'download=',
				'path=',
				'folder=',
				'dir=',
				'url=',
				'site=',
				'id=1',
				'admin=',
				'debug=true',
				'debug=1',
				'test=true',
				'test=1',
				'shell=',
				'eval=',
				'system=',
				'passwd=',
				'password=',
				'pass=',
				'execute=',
				'run=',
				'sql=',
				'query=',
				'inject=',
				'upload=',
				'file_get_contents=',
				'include=',
				'require=',
				'phpinfo=',
				'proc_open=',
				'popen=',
				'passthru=',
				'base64=',
				'encoded=',
				'encode=',
				'decode=',
				'rot13='
			];
			
			// Advanced parameter analysis
			const decodedParams = decodeURIComponent(queryParams);
			
			// Check for suspicious parameter names
			if (suspiciousParams.some(param => queryParams.includes(param) || decodedParams.includes(param))) {
				// Log suspicious query parameters
				console.warn(`[SECURITY] Blocked suspicious query parameters:`, {
					path: req.path,
					fullUrl: req.url,
					method: req.method,
					ip: req.ip || req.connection.remoteAddress,
					userAgent: req.get('User-Agent'),
					queryParams
				});
				
				// Confusing response code to mislead attackers
				return res.status(429).send('Too Many Requests');
			}
			
			// Advanced payload detection in parameters
			const dangerousPatterns = [
				/\.\.\//g, // Directory traversal
				/\b(exec|system|passthru|shell_exec|popen|proc_open|pcntl_exec|eval|assert)\s*\(/g, // PHP function calls
				/<\?|<script|javascript:|data:/g, // Injection attempts 
				/\b(SELECT|INSERT|UPDATE|DELETE|UNION|DROP|ALTER)\b/gi, // SQL keywords
				/\b(and|or|not)\b\s*\d/gi, // SQL logical operators followed by number
				/\b(true|false)\b\s*(=|!=|<>)/gi, // Boolean SQL injections
				/\b(sleep|benchmark|pg_sleep|wait for delay|generate_series)\s*\(/gi, // Time-based SQLi
				/(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, // SQL comment markers
				/\/etc\/(passwd|shadow|group|hosts)/gi, // Sensitive file access
				/\/(proc|sys)\//gi, // System directory access
				/\.(htaccess|htpasswd|git|svn|env)/gi // Configuration files
			];
			
			// Test query parameters against dangerous patterns
			for (const pattern of dangerousPatterns) {
				if (pattern.test(decodedParams)) {
					// Log dangerous payload detection
					console.warn(`[SECURITY] Blocked dangerous payload:`, {
						path: req.path,
						fullUrl: req.url,
						method: req.method,
						ip: req.ip || req.connection.remoteAddress,
						userAgent: req.get('User-Agent'),
						pattern: pattern.toString(),
						matchedOn: decodedParams.match(pattern)[0]
					});
					
					const ip = req.ip || req.connection.remoteAddress;
					banner.setBanned(ip)
					// Return 503 to confuse attacker
					return res.status(503).send('Service Temporarily Unavailable');
				}
			}
		}
		
		// Inspect path for WordPress indicators
		if (path.includes('wp-') || path.includes('wordpress')) {
			// Log detection
			console.warn(`[SECURITY] Potential WordPress probe detected:`, {
				path: req.path,
				method: req.method,
				ip: req.ip || req.connection.remoteAddress,
				userAgent: req.get('User-Agent'),
			});
			
			// Add increased security headers
			res.setHeader('X-Frame-Options', 'DENY');
			res.setHeader('X-XSS-Protection', '1; mode=block');
			res.setHeader('X-Content-Type-Options', 'nosniff');
		}
		
		next();
	};
	
}

// Enhanced path sanitization with honeypot capability
module.exports.sanitizePaths = (banner = null) => {
	return (req, res, next) => {
		// Keep original URL for logging
		const originalUrl = req.url;
		
		// Remove double slashes, normalize path
		req.url = req.url.replace(/\/+/g, '/');
		
		// Decode URL to catch encoded attempts
		try {
			const decodedUrl = decodeURIComponent(req.url);
			
			// Honeypot paths that should never be accessed
			const honeypotPaths = [
				'/admin/secret',
				'/backup',
				'/database',
				'/private',
				'/config',
				'/logs',
				'/db'
			];
			
			// Check if request hits a honeypot path
			if (honeypotPaths.some(trap => decodedUrl.includes(trap))) {
				// Log potential attacker
				console.warn(`[SECURITY] Honeypot triggered:`, {
					path: decodedUrl,
					originalUrl,
					method: req.method,
					ip: req.ip || req.connection.remoteAddress,
					userAgent: req.get('User-Agent'),
					timestamp: new Date().toISOString()
				});
				
				const ip = req.ip || req.connection.remoteAddress;
				banner.setBanned(ip)
				// Return delayed response to waste attacker's time
				setTimeout(() => {
					res.status(200).send('<html><body>Loading...</body></html>');
				}, 5000);
				return;
			}
			
			// Enhanced path traversal detection
			const traversalPatterns = [
				'../', '..\/', '..%2f', '..%5c', // Standard path traversal
				'%2e%2e%2f', '%2e%2e/', '%2e%2e%5c', // URL encoded variants
				'....///', '....//', '....\\', // Evasion techniques
				'../\\', '..\\//', '..%c0%af', '..%ef%bc%8f' // Mixed encoding
			];
			
			if (traversalPatterns.some(pattern => decodedUrl.includes(pattern))) {
				// Log path traversal attempt with detailed info
				const logData = {
					path: decodedUrl,
					originalUrl,
					method: req.method,
					ip: req.ip || req.connection.remoteAddress,
					userAgent: req.get('User-Agent'),
					headers: req.headers,
					timestamp: new Date().toISOString(),
					event: 'path_traversal_attempt'
				};
				
				console.warn(`[SECURITY] Path traversal attempt detected`, logData);
				
				const ip = req.ip || req.connection.remoteAddress;
				banner.setBanned(ip)
				return res.status(404).end(); // Return 404 instead of 403 to confuse attacker
			}
			
			// Check for null byte attacks
			if (decodedUrl.includes('\0') || decodedUrl.includes('%00')) {
				// Log null byte attack attempt
				console.warn(`[SECURITY] Null byte attack detected:`, {
					path: decodedUrl,
					originalUrl,
					method: req.method,
					ip: req.ip || req.connection.remoteAddress,
					userAgent: req.get('User-Agent'),
					headers: req.headers,
					timestamp: new Date().toISOString(),
					event: 'null_byte_attack'
				});
				
				const ip = req.ip || req.connection.remoteAddress;
				banner.setBanned(ip)
				return res.status(400).end();
			}
			
			// Check for command injection attempts in URL
			const commandInjectionPatterns = [
				/\b(wget|curl|bash|nc|netcat|ncat|telnet|python|perl|ruby|php)\b/gi, // Command names
				/[;&|`]/g, // Command separators
				/\$\([^)]*\)/g, // Command substitution
				/\$\{[^}]*\}/g, // Variable substitution
				/\\x[0-9a-f]{2}/gi, // Hex encoding
				/\\u[0-9a-f]{4}/gi, // Unicode escape
				/\b(chmod|chown|chgrp|mkdir|rm|cp|mv|touch)\b/gi // File operations
			];
			
			for (const pattern of commandInjectionPatterns) {
				if (pattern.test(decodedUrl)) {
					// Log command injection attempt
					console.warn(`[SECURITY] Command injection attempt detected:`, {
						path: decodedUrl,
						originalUrl,
						method: req.method,
						ip: req.ip || req.connection.remoteAddress,
						userAgent: req.get('User-Agent'),
						headers: req.headers,
						timestamp: new Date().toISOString(),
						event: 'command_injection_attempt',
						pattern: pattern.toString(),
						matchedOn: decodedUrl.match(pattern)[0]
					});
					
					const ip = req.ip || req.connection.remoteAddress;
					banner.setBanned(ip)
					return res.status(418).end(); // I'm a teapot - confuse the attacker
				}
			}
		} catch (error) {
			// Malformed URL - likely an evasion attempt
			console.warn(`[SECURITY] Malformed URL detected:`, {
				originalUrl,
				method: req.method,
				ip: req.ip || req.connection.remoteAddress,
				userAgent: req.get('User-Agent'),
				error: error.message,
				timestamp: new Date().toISOString(),
				event: 'malformed_url'
			});
			
			return res.status(400).end();
		}
		
		next();
	};
}

// Detect and block common attack patterns
module.exports.blockCommonAttacks = (banner = null) => {
	return (req, res, next) => {
		// Block requests with suspicious user agents
		const userAgent = req.get('User-Agent') || '';
		const blockedAgents = [
			'sqlmap',
			'nikto',
			'nessus',
			'nmap',
			'hydra',
			'gobuster',
			'dirbuster',
			'wpscan',
			'masscan',
			'zgrab',
			'scanbot',
			'default user agent',
			'semrush',
			'python-requests',
			'python-urllib',
			'curl/',
			'wget/',
			'rust-http-client',
			'burpsuite',
			'zap-scan',
			'openvas',
			'acunetix',
			'qualys',
			'nuclei',
			'subfinder',
			'wfuzz',
			'w3af',
			'jok3r',
			'metasploit',
			'xspider',
			'appscan'
		];
		
		// Enhanced user agent detection with scoring system
		let suspiciousScore = 0;
		
		// Check for exact matches
		if (blockedAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
			suspiciousScore += 100; // Instant block
		}
		
		// Check for missing user agent
		if (!userAgent || userAgent === '') {
			suspiciousScore += 50;
		}
		
		// Check for inconsistent user agent (e.g., mobile UA with desktop features)
		if ((userAgent.includes('Android') || userAgent.includes('iPhone')) &&
			(userAgent.includes('AppleWebKit') && !userAgent.includes('Mobile'))) {
			suspiciousScore += 30;
		}
		
		// Check for non-standard user agent length
		if (userAgent.length < 10 || userAgent.length > 500) {
			suspiciousScore += 20;
		}
		
		// Check for randomized user agents (too many numbers or random characters)
		if (/[a-zA-Z0-9]{8,}/.test(userAgent)) {
			suspiciousScore += 15;
		}
		
		// Block if score is too high
		if (suspiciousScore >= 50) {
			// Log suspicious user agent
			console.warn(`[SECURITY] Blocked suspicious user agent:`, {
				userAgent,
				score: suspiciousScore,
				method: req.method,
				path: req.path,
				ip: req.ip || req.connection.remoteAddress,
				timestamp: new Date().toISOString(),
				event: 'suspicious_user_agent'
			});
			
			// Add to blocklist for high scores
			if (suspiciousScore >= 80) {
				const ip = req.ip || req.connection.remoteAddress;
				banner.setBanned(ip)
			}
			
			return res.status(403).end();
		}
		
		// Enhanced header scanning with deeper inspection
		const suspiciousHeaders = [
			'eval',
			'exec',
			'system',
			'passthru',
			'shell',
			'bash',
			'cmd',
			'script',
			'base64',
			'etc/passwd',
			'bin/sh',
			'wget',
			'curl',
			'nc ',
			'netcat',
			'ping -c',
			'whoami',
			'cat /etc',
			'proc/',
			'<script',
			'javascript:',
			'onerror=',
			'onload=',
			'SELECT FROM',
			'UNION SELECT',
			'INSERT INTO',
			'DROP TABLE'
		];
		
		for (const header in req.headers) {
			const headerValue = String(req.headers[header] || '').toLowerCase();
			
			// Check for suspicious content in header values
			if (suspiciousHeaders.some(term => headerValue.includes(term))) {
				// Log suspicious header
				console.warn(`[SECURITY] Blocked request with suspicious header:`, {
					header,
					headerValue,
					method: req.method,
					path: req.path,
					ip: req.ip || req.connection.remoteAddress,
					userAgent,
					timestamp: new Date().toISOString(),
					event: 'suspicious_header'
				});
				
				const ip = req.ip || req.connection.remoteAddress;
				banner.setBanned(ip)
				return res.status(400).end();
			}
		}
		
		// Check for suspiciously large payloads
		const contentLength = parseInt(req.get('Content-Length') || '0', 10);
		if (contentLength > 10 * 1024 * 1024) { // 10MB limit
			// Log suspicious payload size
			console.warn(`[SECURITY] Blocked request with large payload:`, {
				contentLength,
				method: req.method,
				path: req.path,
				ip: req.ip || req.connection.remoteAddress,
				userAgent,
				timestamp: new Date().toISOString(),
				event: 'large_payload'
			});
			
			return res.status(413).end(); // Payload Too Large
		}
		
		// IP range-based blocking for known malicious ranges
		const maliciousIpRanges = [
			// Add known malicious IP ranges here
			'185.156.73.0/24',
			'185.156.74.0/24',
			'89.248.0.0/16',
			'185.220.0.0/16',
			'193.118.53.0/24',
			'5.188.206.0/24',
			'45.146.164.0/24',
			'45.155.205.0/24',
			'77.247.108.0/24',
			'77.247.110.0/24',
			'94.102.49.0/24',
			'171.25.193.0/24',
			'192.119.14.0/24'
		];
		
		const clientIp = req.ip || req.connection.remoteAddress;
		if (clientIp && maliciousIpRanges.some(range => ipRangeCheck(clientIp, range))) {
			// Log blocked IP range
			console.warn(`[SECURITY] Blocked request from known malicious IP range:`, {
				ip: clientIp,
				method: req.method,
				path: req.path,
				userAgent,
				timestamp: new Date().toISOString(),
				event: 'malicious_ip_range'
			});
			
			return res.status(403).end();
		}
		
		next();
	};
}