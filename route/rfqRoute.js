import express from "express";
import { approveOrRejectRFQ, assignRFQtoUser, deleteRFQDocument, deleteRFQDocumentPermanently, downloadRFQDocument, getRFQDetail, getRFQDocuments, getStatesOfRFQ, rejectRFQbyPlantHead, saveRFQandSKUdata, uploadRFQDocuments } from "../controller/rfqController.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/saverfq', saveRFQandSKUdata);         // Save rfq
router.post("/getrfq", getRFQDetail);               // fetch rfq

// rfq documents routes
router.post("/:rfqId/documents", authenticateUser, uploadRFQDocuments);
router.get("/:rfqId/documents", authenticateUser, getRFQDocuments);
router.get("/:documentId/download", authenticateUser, downloadRFQDocument);
router.delete("/:documentId/docdelete", authenticateUser, deleteRFQDocument);
router.delete("/:documentId/docdelete/permanent", authenticateUser, deleteRFQDocumentPermanently);

// Approve RFQ and assign to plant
router.post("/approve", approveOrRejectRFQ);                // Approve or reject rfq

// Get state
router.get("/states/", authenticateUser, getStatesOfRFQ);           // fetch all state
router.get("/states/:id", authenticateUser, getStatesOfRFQ);        // fetch state by id


router.post("/assign/", authenticateUser, assignRFQtoUser);                     // Assign rfq to user
router.post("/reject-byplanthead/", authenticateUser, rejectRFQbyPlantHead);    // Reject rfq by plant head

export default router;