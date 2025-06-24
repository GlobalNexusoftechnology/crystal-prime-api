import express from "express";
import { clientController } from "../controllers/clients.controller";
import { deserializeUser, requireUser } from "../middleware";
import multer from "multer";

const router = express.Router();
const controller = clientController();
const upload = multer();

router.use(deserializeUser, requireUser);

// Routes
router.post("/", controller.createClient);
router.get("/", controller.getAllClients);
router.get("/:id", controller.getClientById);
router.put("/:id", controller.updateClient);      
router.delete("/:id", controller.softDeleteClient);
router.get("/export/excel", controller.exportClientsExcelController);
router.get('/template/download', controller.downloadClientTemplate);
router.post("/upload-excel", upload.single("file"), controller.uploadClientsFromExcelController);

export default router;
