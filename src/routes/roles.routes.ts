import express from "express";
import { roleController } from "../controllers/roles.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = express.Router();

// Call the controller function to get the methods
const controller = roleController();

// router.use(deserializeUser, requireUser);

router.post("/", controller.createRole);
router.get("/", controller.getAllRoles);
router.get("/:id", controller.getRoleById);
router.put("/:id", controller.updateRole);
router.delete("/:id", controller.softDeleteRole);

export default router;
