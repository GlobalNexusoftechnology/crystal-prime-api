import express from "express";
import { clientDetailsController } from "../controllers/clients-details.controller";

const router = express.Router();
const controller = clientDetailsController();

router.post("/", controller.createClientDetails);
router.get("/", controller.getAllClientDetails);
router.get("/:id", controller.getClientDetailsById);
router.put("/:id", controller.updateClientDetails);
router.delete("/:id", controller.softDeleteClientDetails);

export default router;
