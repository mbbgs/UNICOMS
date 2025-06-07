const express = require('express');
const router = express.Router();
const {
 AddStudent,
 AddStudentsFromCSV
} = require('../controllers/studentControllers.js');
const {
 requireAdminPerm,
 requireLogin
} = require('../middlewares/auth.js');

const upload = require('../middlewares/fileUpload.js');

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Super Admin student management
 */

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Add a new student manually
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - faculty
 *               - email
 *               - password
 *               - matric
 *               - departmentCode
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               faculty:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               matric:
 *                 type: string
 *               departmentCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate email or matric
 *       500:
 *         description: Internal server error
 */
router.post('/', requireAdminPerm, AddStudent);

/**
 * @swagger
 * /api/students/csv:
 *   post:
 *     summary: Bulk upload students via CSV
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Students added successfully
 *       400:
 *         description: Bad file or duplicate entries
 *       500:
 *         description: Internal Server Error
 */
router.post('/csv', requireAdminPerm, upload.single('file'), AddStudentsFromCSV);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get('/', requireLogin, GetStudent);

module.exports = router;