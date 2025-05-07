import express from "express";
import {
    createLead,
    getLeadById,
    getAllLead,
    updateLead,
    softDeleteLead
}
    from "../controllers";

const router = express.Router();

router.post("/", createLead);
router.get("/:id", getLeadById);
router.get("/", getAllLead);
router.put("/:id", updateLead);
router.delete('/:id', softDeleteLead);

export default router;