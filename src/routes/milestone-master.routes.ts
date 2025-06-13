import express from "express";
import { milestoneMasterController } from "../controllers/milestone-master.controller";

const router = express.Router();
const controller = milestoneMasterController();

router.post("/", controller.createMaster);
router.get("/", controller.getAllMaster);
router.get("/:id", controller.getByIdMaster);
router.put("/:id", controller.updateMaster);
router.delete("/:id", controller.deleteMaster);

export default router;
