const express = require('express');
const router = express.Router();
const {
 GetDepartmentCourses,
 RegisterCourses,
 UpdateRegisteredCourses
} = require('../controllers/courseControllers.js');
const { requireAuth } = require('../middlewares/auth.js');

/**
 * @swagger
 * /api/course/department-courses:
 *   post:
 *     summary: Get available courses for a department and level
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *               - faculty
 *               - code
 *             properties:
 *               level:
 *                 type: string
 *               faculty:
 *                 type: string
 *               code:
 *                 type: string
 *                 description: Department code
 *     responses:
 *       200:
 *         description: Courses fetched successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Department or level not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/department-courses', GetDepartmentCourses);


/**
 * @swagger
 * /api/course/register:
 *   post:
 *     summary: Register courses for a student
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courses
 *             properties:
 *               courses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of course codes to register
 *     responses:
 *       200:
 *         description: Courses registered successfully
 *       400:
 *         description: Invalid input or unit limit error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student or courses not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/register', requireAuth, RegisterCourses);


/**
 * @swagger
 * /api/course/update-registered:
 *   post:
 *     summary: Add new courses to already registered ones
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coursesToAdd
 *             properties:
 *               coursesToAdd:
 *                 type: array
 *                 description: Array of course codes or objects
 *                 items:
 *                   oneOf:
 *                     - type: string
 *                     - type: object
 *                       properties:
 *                         courseCode:
 *                           type: string
 *                         isCarryOver:
 *                           type: boolean
 *     responses:
 *       200:
 *         description: Courses updated successfully
 *       400:
 *         description: Invalid input or unit constraint issues
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student or available courses not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/update-registered', requireAuth, UpdateRegisteredCourses);


module.exports = router;