import express from "express";
import { getProductsBySKUId, getSKUbyRFQid, saveProductswithSKUdetails } from "../controller/skuController.js";
import authenticateUser from "../middleware/authMiddleware.js";


const router = express.Router();


router.get("/getsku/:rfqId", authenticateUser, getSKUbyRFQid);
router.post("/saveproducts", authenticateUser, saveProductswithSKUdetails);
router.get("/getproducts/:p_sku_id", authenticateUser, getProductsBySKUId);

export default router;