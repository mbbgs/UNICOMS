const express = require('express');
const router = express.Router();
const {
  CreateExam,
  AddExamDepartment,
  RemoveExamDepartment,
  GetExam
} = require('../controllers/examControllers.js');
const { requireSAAuth, requireLogin } = require('../middlewares/auth.js');

/**
 * @swagger
 * tags:
 *   name: Exams
 *   description: Exam management
 */

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create a new exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *               - departmentCode
 *               - courseTitle
 *               - courseCode
 *               - level
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               departmentCode:
 *                 type: string
 *               courseTitle:
 *                 type: string
 *               courseCode:
 *                 type: string
 *               level:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Exam created successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Conflict — exam already exists
 *       500:
 *         description: Internal Server Error
 */
router.post('/', requireSAAuth, CreateExam);

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: Get exam by date, code, and courseTitle
 *     tags: [Exams]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: courseTitle
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Exam retrieved successfully
 *       400:
 *         description: Missing parameters or invalid department
 *       403:
 *         description: Exam not started or ended
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/', requireLogin, GetExam);

/**
 * @swagger
 * /api/exams/add-department:
 *   post:
 *     summary: Add a department to an exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - code
 *               - courseTitle
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               code:
 *                 type: string
 *               courseTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department added
 *       400:
 *         description: Missing fields or invalid department
 *       409:
 *         description: Department already added
 *       500:
 *         description: Internal Server Error
 */
router.post('/add-department', requireSAAuth, AddExamDepartment);

/**
 * @swagger
 * /api/exams/remove-department:
 *   post:
 *     summary: Remove a department from an exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - code
 *               - courseTitle
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               code:
 *                 type: string
 *               courseTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department removed
 *       400:
 *         description: Missing fields or invalid department
 *       409:
 *         description: Department not found on exam
 *       500:
 *         description: Internal Server Error
 */
router.post('/remove-department', requireSAAuth, RemoveExamDepartment);

module.exports = router;