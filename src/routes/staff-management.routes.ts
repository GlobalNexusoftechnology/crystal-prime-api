import { Router } from "express";
import { staffController } from "../controllers/staff-management.controller";

const router = Router();
const controller = staffController();

//  POST /api/staff - Create new staff
router.post("/", controller.createStaff);

// GET /api/staff - Get all staff with pagination, search, sort
router.get("/", controller.getAllStaff);

// GET /api/staff/:id - Get single staff by ID
router.get("/:id", controller.getStaffById);

// PUT /api/staff/:id - Update staff
router.put("/:id", controller.updateStaff);

// DELETE /api/staff/:id - Soft delete staff
router.delete("/:id", controller.softDeleteStaff);

export default router;
