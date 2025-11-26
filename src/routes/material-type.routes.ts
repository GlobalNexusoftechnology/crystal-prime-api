import express from "express";
import { deserializeUser, requireUser, validate } from "../middleware";
import {
  createMaterialTypeHandler,
  getAllMaterialTypesHandler,
  getMaterialTypeByIdHandler,
  updateMaterialTypeHandler,
  deleteMaterialTypeHandler,
} from "../controllers/material-type.controller";
import { materialTypeSchema } from "../schemas";

const router = express.Router();
router.use(deserializeUser, requireUser);

router.post("/", validate(materialTypeSchema), createMaterialTypeHandler);
router.get("/", getAllMaterialTypesHandler);
router.get("/:id", getMaterialTypeByIdHandler);
router.put("/:id", validate(materialTypeSchema), updateMaterialTypeHandler);
router.delete("/:id", deleteMaterialTypeHandler);

export default router;
