import { Router } from "express";
import { clientFollowupController } from "../controllers/clients-followups.controller";

const router = Router();
const controller = clientFollowupController();

router.post("/", controller.createFollowup);
router.get("/", controller.getAllFollowups);
router.get("/:id", controller.getFollowupById);
router.put("/:id", controller.updateFollowup);
router.delete("/:id", controller.softDeleteFollowup);

export default router;
