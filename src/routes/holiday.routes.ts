// src/routes/holidayRoutes.ts
import { Router } from "express";
import { createHoliday, deleteHoliday, getAllHolidays, getHolidayById, updateHoliday  } from "../controllers"
import { deserializeUser, requireUser } from "../middleware";

const router = Router();

router.use(deserializeUser, requireUser);

router.post("/", createHoliday);
router.get("/", getAllHolidays);
router.get("/:id", getHolidayById);
router.put("/:id", updateHoliday);
router.delete("/:id", deleteHoliday);

export default router;
