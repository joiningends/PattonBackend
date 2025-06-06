import express from "express";
import { approveOrRejectRFQ, assignRFQtoUser, autoCalculateCostsByRfqId, autoLatestCalculateCostsByRfqId, deleteRFQDocument, deleteRFQDocumentPermanently, downloadRFQDocument, getRFQDetail, getRFQDetailByUserRole, getRFQDocuments, getRFQforPlantHead, getStatesOfRFQ, insertCommentsForRFQ, insertFactoryOverheadCost, insertRFQVersions, insertTotalFactoryCost, rejectRFQwithState, saveRFQandSKUdata, updateRfqState, updateRFQStatus, uploadRFQDocuments } from "../controller/rfqController.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/saverfq', saveRFQandSKUdata);         // Save rfq
router.post("/getrfq", getRFQDetail);               // fetch rfq
router.post("/getrfq-planthead", authenticateUser, getRFQforPlantHead);               // fetch rfq
router.get("/update-rfq/status/:rfqid/:status", authenticateUser, updateRFQStatus);
router.get("/getrfqbyuserrole/:user_id", getRFQDetailByUserRole);

// rfq documents routes
router.post("/:rfqId/documents", authenticateUser, uploadRFQDocuments);
router.get("/:rfqId/documents", authenticateUser, getRFQDocuments);
router.get("/:documentId/download", authenticateUser, downloadRFQDocument);
router.delete("/:documentId/docdelete", authenticateUser, deleteRFQDocument);
router.delete("/:documentId/docdelete/permanent", authenticateUser, deleteRFQDocumentPermanently);

// Approve RFQ and assign to plant
router.post("/approve", authenticateUser, approveOrRejectRFQ);      // Approve or reject rfq

// Get state
router.get("/states/", authenticateUser, getStatesOfRFQ);           // fetch all state
router.get("/states/:id", authenticateUser, getStatesOfRFQ);        // fetch state by id

// Assing reject RFQ
router.post("/assign/", authenticateUser, assignRFQtoUser);                     // Assign rfq to user
router.post("/reject/", authenticateUser, rejectRFQwithState);    // Reject rfq by plant head

router.post("/auto-calculate/", authenticateUser, autoCalculateCostsByRfqId);
router.post("/auto-latest-calculate/", authenticateUser, autoLatestCalculateCostsByRfqId);

router.post("/update/rfq-state/", authenticateUser, updateRfqState);

// Factory overhead 
router.post("/save-factory-overhead/", authenticateUser, insertFactoryOverheadCost);
router.get("/calculate/total-factory-cost/:rfqid", authenticateUser, insertTotalFactoryCost);

//Insert comments
router.post("/save-comments/", authenticateUser, insertCommentsForRFQ); 

// Versions
router.post("/save-rfq-version/", authenticateUser, insertRFQVersions);

export default router;