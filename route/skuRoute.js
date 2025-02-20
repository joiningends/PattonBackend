import express from "express";
import { getSKUbyRFQid, saveProductswithSKUdetails } from "../controller/skuController.js";


const router = express.Router();


router.get("/getsku/:rfqId", getSKUbyRFQid);
router.post("/saveproducts", saveProductswithSKUdetails);

export default router;