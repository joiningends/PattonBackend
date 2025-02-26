import express from "express";
import { approveOrRejectRFQ, deleteRFQDocument, deleteRFQDocumentPermanently, downloadRFQDocument, getRFQDetail, getRFQDocuments, saveRFQandSKUdata, uploadRFQDocuments } from "../controller/rfqController.js";

const router = express.Router();

router.post('/saverfq', saveRFQandSKUdata);
router.post("/getrfq", getRFQDetail);

// rfq documents routes
router.post("/:rfqId/documents", uploadRFQDocuments);
router.get("/:rfqId/documents", getRFQDocuments);
router.get("/:documentId/download", downloadRFQDocument);
router.delete("/:documentId/docdelete", deleteRFQDocument);
router.delete("/:documentId/docdelete/permanent", deleteRFQDocumentPermanently);

// Approve RFQ and assign to plant
router.post("/approve", approveOrRejectRFQ);

export default router;