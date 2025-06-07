const express = require('express')
const authRouter = express.Router()
const {
 CreateAccount,
 UserLogin,
 GenerateIC,
 VerifySU
} = require('../controllers/authControllers.js')

const { requireLogin, requireAdminPerm, requireSAAuth } = require('../middlewares/auth.js')


/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Auth endpoints for registration, login, and invitation code management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - firstName
 *               - otherNames
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               otherNames:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Username already taken
 *       500:
 *         description: Internal server error
 */
authRouter.post('/register', CreateAccount);

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Log in a user or student
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or Matric Number
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
authRouter.post('/signin', UserLogin);

/**
 * @swagger
 * /api/auth/generate-invitation-code:
 *   post:
 *     summary: Generate invitation code for unassigned user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation code generated
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized or user not eligible
 *       500:
 *         description: Internal server error
 */
authRouter.post('/generate-invitation-code', requireSAAuth, GenerateIC);


/**
 * @swagger
 * /api/auth/accept-invitation:
 *   post:
 *     summary: Accept invitation to become Admin
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - token
 *             properties:
 *               userId:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin privilege granted
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized or expired code
 *       500:
 *         description: Internal server error
 */
authRouter.post('/accept-invitation', VerifySU);


module.exports = authRouter