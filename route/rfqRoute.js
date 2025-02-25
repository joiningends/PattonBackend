import express from "express";
import { deleteRFQDocument, deleteRFQDocumentPermanently, downloadRFQDocument, getRFQDetail, getRFQDocuments, saveRFQandSKUdata, uploadRFQDocuments } from "../controller/rfqController.js";

const router = express.Router();

router.post('/saverfq', saveRFQandSKUdata);
router.post("/getrfq", getRFQDetail);

// rfq documents routes
router.post("/:rfqId/documents", uploadRFQDocuments);
router.get("/:rfqId/documents", getRFQDocuments);
router.get("/:documentId/download", downloadRFQDocument);
router.delete("/:documentId/docdelete", deleteRFQDocument);
router.delete("/:documentId/docdelete/permanent", deleteRFQDocumentPermanently);

export default router;