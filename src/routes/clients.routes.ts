import { Router } from "express";
import { clientController } from "../controllers/clients.controller";

const router = Router();
const controller = clientController();

// Routes
router.post("/create-client", controller.createClient);
router.get("/", controller.getAllClients);
router.get("/:id", controller.getClientById);
router.put("/:id", controller.updateClient);      
router.delete("/:id", controller.softDeleteClient);

export default router;
