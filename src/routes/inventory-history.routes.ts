import { createInventoryHistory, deleteInventoryHistory, getAllInventoryHistory, getInventoryHistoryById, updateInventoryHistory } from "controllers/inventory-history.controller";
import { Router } from "express";
import { deserializeUser, requireUser } from "middleware";


const router = Router();
router.use(deserializeUser, requireUser);

router.post("/", createInventoryHistory);
router.get("/", getAllInventoryHistory);
router.get("/:id", getInventoryHistoryById);
router.put("/:id", updateInventoryHistory);
router.delete("/:id", deleteInventoryHistory);

export default router;
