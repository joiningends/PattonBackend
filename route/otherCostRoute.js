import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteOtherCost, deleteOtherCostBySkuAndRfqidOtherCostId, editLatestOtherCostById, editOtherCost, editOtherCostById, getLatestOtherCostBySkuAndRfqid, getOtherCost, getOtherCostBySkuAndRfqid, saveLatestOtherCostWithSkuId, saveOtherCost, saveOtherCostWithSkuId } from "../controller/otherCostController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveOtherCost);
router.get("/", authenticateUser, getOtherCost);
router.get("/:id", authenticateUser, getOtherCost);
router.post("/edit/:id", authenticateUser, editOtherCost);
router.get("/delete/:id", authenticateUser, deleteOtherCost);
router.post("/by-skuid/", authenticateUser, saveOtherCostWithSkuId);
router.post("/by-skuid-latest/", authenticateUser, saveLatestOtherCostWithSkuId);
router.get("/get-byskurfq/:rfq_id/:sku_id", authenticateUser, getOtherCostBySkuAndRfqid);
router.get("/get-latest-byskurfq/:rfq_id/:sku_id", authenticateUser, getLatestOtherCostBySkuAndRfqid);
router.delete("/delete/othercost-sku/:id", authenticateUser, deleteOtherCostBySkuAndRfqidOtherCostId);
router.post("/edit/othercost/sku/", authenticateUser, editOtherCostById);
router.post("/edit/othercost-latest/sku/", authenticateUser, editLatestOtherCostById);


export default router;