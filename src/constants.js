module.exports = {
  ROLES: ['SuperAdmin', 'Admin', 'Student', '<unassigned>'],
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
  ROLE_UNASSIGNED: '<unassigned>',
  DEPARTMENT_MIN_UNIT: 15,
  TOTAL_UNIT_LIMIT: 24,
  SUSPICIOUS_THRESHOLD_MS: 5 * 60 * 1000
}