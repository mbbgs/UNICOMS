const express = require('express');
const router = express.Router();
const {
  CreateDepartment,
  GetAllDepartments,
  GetDepartmentByCode,
  UpdateDepartment,
  AddCourseToLevel,
  RemoveCourseFromLevel
} = require('../controllers/departmentControllers.js');
const { requireAdminPerm } = require('../middlewares/auth.js');

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [faculty, name, code]
 *             properties:
 *               faculty:
 *                 type: string
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               totalUnitLimit:
 *                 type: number
 *               coursesPerLevel:
 *                 type: object
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       code:
 *                         type: string
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal Server Error
 */
router.post('/', requireAdminPerm, createDepartment);


/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: List of departments
 *       404:
 *         description: No departments found
 *       500:
 *         description: Internal Server Error
 */
router.get('/', getAllDepartments);


/**
 * @swagger
 * /api/departments/{code}:
 *   get:
 *     summary: Get a department by code
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Department code
 *     responses:
 *       200:
 *         description: Department found
 *       404:
 *         description: Department not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:code', getDepartmentByCode);


/**
 * @swagger
 * /api/departments:
 *   put:
 *     summary: Update department details
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               faculty:
 *                 type: string
 *               coursesPerLevel:
 *                 type: object
 *     responses:
 *       200:
 *         description: Department updated
 *       404:
 *         description: Department not found
 *       500:
 *         description: Internal Server Error
 */
router.put('/', requireAdminPerm, updateDepartment);


/**
 * @swagger
 * /api/departments/course:
 *   post:
 *     summary: Add a course to a department level
 *     tags: [Departments]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Department code
 *       - in: query
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *         description: Level (e.g. "100lvl")
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, code]
 *             properties:
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Department or level not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/course', requireAdminPerm, addCourseToLevel);


/**
 * @swagger
 * /api/departments/course/{code}/{level}:
 *   delete:
 *     summary: Remove a course from a department level
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseCode]
 *             properties:
 *               courseCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course removed successfully
 *       404:
 *         description: Course or department not found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/course/:code/:level', requireAdminPerm, removeCourseFromLevel);


module.exports = router;