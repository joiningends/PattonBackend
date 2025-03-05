import express from "express";
import { approveOrRejectRFQ, deleteRFQDocument, deleteRFQDocumentPermanently, downloadRFQDocument, getRFQDetail, getRFQDocuments, saveRFQandSKUdata, uploadRFQDocuments } from "../controller/rfqController.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/saverfq', saveRFQandSKUdata);
router.post("/getrfq", getRFQDetail);

// rfq documents routes
router.post("/:rfqId/documents", authenticateUser, uploadRFQDocuments);
router.get("/:rfqId/documents", authenticateUser, getRFQDocuments);
router.get("/:documentId/download", authenticateUser, downloadRFQDocument);
router.delete("/:documentId/docdelete", authenticateUser, deleteRFQDocument);
router.delete("/:documentId/docdelete/permanent", authenticateUser, deleteRFQDocumentPermanently);

// Approve RFQ and assign to plant
router.post("/approve", approveOrRejectRFQ);

export default router;