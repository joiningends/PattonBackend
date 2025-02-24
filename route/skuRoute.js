import express from "express";
import { getProductsBySKUId, getSKUbyRFQid, saveProductswithSKUdetails } from "../controller/skuController.js";


const router = express.Router();


router.get("/getsku/:rfqId", getSKUbyRFQid);
router.post("/saveproducts", saveProductswithSKUdetails);
router.get("/getproducts/:p_sku_id", getProductsBySKUId);

export default router;