const express = require('express');
const router = express.Router();
const {
  DeleteTicket,
  CreateTicket,
  UpdateTicket,
  GetTicketById,
  GetAllTickets
} = require('../controllers/ticketControllers.js');


const { requireSAAuth, requireLogin } = require('../middlewares/auth.js');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Support ticket system for super admins
 */

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - studentId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               studentId:
 *                 type: string
 *               course:
 *                 type: string
 *               exam:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               type:
 *                 type: string
 *                 enum: [course_issue, exam_issue, technical, general]
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/', requireLogin, CreateTicket);

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get all tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tickets fetched successfully
 *       500:
 *         description: Internal Server Error
 */
router.get('/', requireSAAuth, GetAllTickets);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket fetched successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', requireSAAuth, GetTicketById);

/**
 * @swagger
 * /api/tickets/{id}:
 *   patch:
 *     summary: Update ticket fields
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               response:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               type:
 *                 type: string
 *                 enum: [course_issue, exam_issue, technical, general]
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Internal Server Error
 */
router.patch('/:id', requireSAAuth, UpdateTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Delete ticket by ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *       400:
 *         description: Invalid ticket ID
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:id', requireSAAuth, DeleteTicket);

module.exports = router;