import { Router } from "express";
import { checkIn, checkOut, getAllAttendance, getAttendanceByStaff } from "../controllers";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();

router.use(deserializeUser, requireUser);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/staff/:staffId", getAttendanceByStaff);
router.get("/all", getAllAttendance); 

export default router;
