import express from "express";
import { deleteProductById, editBomCostPerkgByProductId, editNetWeightOfProductByProductId, editYieldPercentageByProductId, getProductsBySKUId, getSKUbyRFQid, saveBOMProductswithSKUdetails, saveProductswithSKUdetails } from "../controller/skuController.js";
import authenticateUser from "../middleware/authMiddleware.js";


const router = express.Router();


router.get("/getsku/:rfqId", authenticateUser, getSKUbyRFQid);
router.post("/saveproducts", authenticateUser, saveProductswithSKUdetails);
router.post("/save-bomproducts", authenticateUser, saveBOMProductswithSKUdetails);
router.get("/getproducts/:p_sku_id", authenticateUser, getProductsBySKUId);
router.delete("/deleteproduct/:product_id", authenticateUser, deleteProductById);
router.post("/edit/yield-percentage", authenticateUser, editYieldPercentageByProductId);
router.post("/edit/bomcostperkg", authenticateUser, editBomCostPerkgByProductId);
router.post("/edit/netweight-product", authenticateUser, editNetWeightOfProductByProductId);

export default router;