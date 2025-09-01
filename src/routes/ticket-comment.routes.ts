import { Router } from "express";
import { ticketCommentController } from "../controllers/ticket-comment.controller";
import { deserializeUser, requireUser } from "../middleware";
import { validate } from "../middleware/validate";
import { createTicketCommentSchema, updateTicketCommentSchema, getTicketCommentsSchema } from "../schemas/ticket-comment.schema";

const router = Router();
const controller = ticketCommentController();

// Apply authentication middleware to all routes
router.use(deserializeUser, requireUser);

// Create ticket comment
router.post("/", validate(createTicketCommentSchema), controller.createTicketComment);

// Get all comments for a specific ticket
router.get("/ticket/:ticket_id", validate(getTicketCommentsSchema), controller.getAllTicketComments);

// Get ticket comment by ID
router.get("/:id", controller.getTicketCommentById);

// Update ticket comment
router.put("/:id", validate(updateTicketCommentSchema), controller.updateTicketComment);

// Delete ticket comment
router.delete("/:id", controller.deleteTicketComment);

export default router;
