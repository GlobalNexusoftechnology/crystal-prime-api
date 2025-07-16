import { Router } from "express";
import { dailyTaskEntryController } from "../controllers/daily-task.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();

const controller = dailyTaskEntryController();

router.use(deserializeUser, requireUser);

router.post("/", controller.createEntry);
router.get("/", controller.getAllEntries);
router.get("/:id", controller.getEntryById);
router.put("/:id", controller.updateEntry);
router.delete("/:id", controller.softDeleteEntry);

export default router;
