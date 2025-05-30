import express from "express";
import { leadTypeController } from "../controllers/lead-types.controller";

const router = express.Router();
const controller = leadTypeController();

router.post("/", controller.createLeadType);
router.get("/", controller.getAllLeadTypes);
router.get("/:id", controller.getLeadTypeById);
router.put("/:id", controller.updateLeadType);
router.delete("/:id", controller.softDeleteLeadType);

export default router;

