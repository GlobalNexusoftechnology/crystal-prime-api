import express from "express";
import { leadController } from "../controllers/leads.controller";
import { deserializeUser, requireUser } from "../middleware";
import { excelUpload } from "../utils/upload";

const router = express.Router();
const controller = leadController();

router.get("/meta/webhook", controller.verifyMetaWebhook);
router.post("/meta/webhook", controller.metaLeadWebhook);
router.post("/google/webhook", controller.googleLeadWebhook);

router.use(deserializeUser, requireUser);

router.post("/", controller.createLead);
router.get("/", controller.getAllLeads);
router.get("/:id", controller.getLeadById);
router.put("/:id", controller.updateLead);
router.delete("/:id", controller.softDeleteLead);
router.get("/export/excel", controller.exportLeadsExcelController);
router.get('/template/download', controller.downloadLeadTemplate);
router.post("/upload-excel", excelUpload.single("file"), controller.uploadLeadsFromExcel);
router.get("/:id/quotation", controller.exportQuotationDoc);
export default router;
