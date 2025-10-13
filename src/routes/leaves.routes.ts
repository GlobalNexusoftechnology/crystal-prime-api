import { Router } from "express";
import { applyLeave, getAllLeaves, getLeavesByStaff, updateLeaveStatus } from "../controllers";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();

router.use(deserializeUser, requireUser);

router.post("/", applyLeave);
router.put("/:id", updateLeaveStatus);
router.get("/", getAllLeaves);
router.get("/staff/:staffId", getLeavesByStaff);

export default router;
