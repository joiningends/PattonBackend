import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteOtherCost, deleteOtherCostBySkuAndRfqidOtherCostId, editOtherCost, editOtherCostById, getOtherCost, getOtherCostBySkuAndRfqid, saveOtherCost, saveOtherCostWithSkuId } from "../controller/otherCostController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveOtherCost);
router.get("/", authenticateUser, getOtherCost);
router.get("/:id", authenticateUser, getOtherCost);
router.post("/edit/:id", authenticateUser, editOtherCost);
router.get("/delete/:id", authenticateUser, deleteOtherCost);
router.post("/by-skuid/", authenticateUser, saveOtherCostWithSkuId);
router.get("/get-byskurfq/:rfq_id/:sku_id", authenticateUser, getOtherCostBySkuAndRfqid);
router.delete("/delete/othercost-sku/:id", authenticateUser, deleteOtherCostBySkuAndRfqidOtherCostId);
router.post("/edit/othercost/sku/", authenticateUser, editOtherCostById);

export default router;