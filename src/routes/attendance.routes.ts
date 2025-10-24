import { Router } from "express";
import { checkIn, checkOut, getAllAttendance, getAttendanceByStaff, exportAttendanceExcel, getTodayStatus } from "../controllers";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();

router.use(deserializeUser, requireUser);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/staff/:staffId", getAttendanceByStaff);
router.get("/status/:staffId", getTodayStatus);
router.get("/all", getAllAttendance);
router.get("/export/excel", exportAttendanceExcel); 

export default router;
