import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";

const router = Router();
const controller = ticketController();

// Create ticket
router.post("/", controller.createTicket);

// Get all tickets
router.get("/", controller.getAllTickets);

// Get tickets by project
router.get("/project/:projectId", controller.getTicketsByProject);

// Get ticket by ID
router.get("/:id", controller.getTicketById);

// Update ticket
router.put("/:id", controller.updateTicket);

// Update ticket status (support workflow)
router.put("/:id/status", controller.updateTicketStatus);

// Delete ticket
router.delete("/:id", controller.deleteTicket);

export default router;
