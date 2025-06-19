import express from "express";
import { clientController } from "../controllers/clients.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = express.Router();
const controller = clientController();

router.use(deserializeUser, requireUser);

// Routes
router.post("/", controller.createClient);
router.get("/", controller.getAllClients);
router.get("/:id", controller.getClientById);
router.put("/:id", controller.updateClient);      
router.delete("/:id", controller.softDeleteClient);
router.get("/export/excel", controller.exportClientsExcelController);
router.get('/template/download', controller.downloadClientTemplate);

export default router;
