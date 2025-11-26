import express from "express";
import { deserializeUser, requireUser, validate } from "../middleware";
import { materialBrandSchema } from "../schemas/material-brand.schema";
import {
  createMaterialBrandHandler,
  getAllMaterialBrandsHandler,
  getMaterialBrandByIdHandler,
  updateMaterialBrandHandler,
  deleteMaterialBrandHandler,
} from "../controllers/material-brand.controller";

const router = express.Router();
router.use(deserializeUser, requireUser);

router.post("/", validate(materialBrandSchema), createMaterialBrandHandler);
router.get("/", getAllMaterialBrandsHandler);
router.get("/:id", getMaterialBrandByIdHandler);
router.put("/:id", validate(materialBrandSchema), updateMaterialBrandHandler);
router.delete("/:id", deleteMaterialBrandHandler);

export default router;
