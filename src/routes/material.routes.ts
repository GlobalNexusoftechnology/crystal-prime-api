import { Router } from "express";
import multer from "multer";
import { materialController } from "../controllers/material.controller";

const upload = multer();
const router = Router();
const ctrl = materialController();

router.post("/", ctrl.createMaterial);
router.get("/", ctrl.getAllMaterials);
router.get("/:id", ctrl.getMaterialById);
router.put("/:id", ctrl.updateMaterial);
router.delete("/:id", ctrl.softDeleteMaterial);
router.put("/:id/change-status", ctrl.changeStatusMaterial);
router.get("/export/excel", ctrl.exportMaterialsExcel);
router.get("/template/download", ctrl.downloadMaterialTemplate);
router.post("/import/excel", upload.single("file"), ctrl.uploadMaterialsFromExcel);

export default router; 