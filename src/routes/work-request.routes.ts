import express from "express";
import {
  createWorkRequest,
  getAllWorkRequests,
  updateWorkRequestStatus,
} from "../controllers/work-request.controller";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import { restrictTo } from "../middleware/restrictTo";

const router = express.Router();

router.use(deserializeUser, requireUser);

router.post("/", createWorkRequest);

router.get(
  "/",
  getAllWorkRequests
);

router.put(
  "/:requestId/status",
  restrictTo("admin"),
  updateWorkRequestStatus
);

export default router;
