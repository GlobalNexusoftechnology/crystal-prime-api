import { Router } from "express";
import { projectTemplateController } from "../controllers/project-templates.controller";

const router = Router();
const controller = projectTemplateController();

router.post("/", controller.createTemplate);
router.get("/", controller.getAllTemplates);
router.get("/:id", controller.getTemplateById);
router.put("/:id", controller.updateTemplate);
router.delete("/:id", controller.softDeleteTemplate);

export default router;
