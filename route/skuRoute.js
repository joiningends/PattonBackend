import express from "express";
import { calculateSubTotalCost, deleteJobCostBySkuJobId, deleteProductById, editBomCostPerKgbyProductId, editBomCostPerkgByProductId, editNetWeightOfProductByProductId, editProductNetWeightProductId, editYieldPercbyProductId, editYieldPercentageByProductId, getJobCostsByRfqAndSku, getProductsBySKUId, getSKUbyRFQid, saveBOMProductswithSKUdetails, saveOrUpdateJobCost, saveProductswithSKUdetails, updateAssemblyWeightBySkuid } from "../controller/skuController.js";
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
router.get("/calculate-assembly/:sku_id", authenticateUser, updateAssemblyWeightBySkuid);
router.post("/edit-yield", authenticateUser, editYieldPercbyProductId);
router.post("/edit-bom-cost", authenticateUser, editBomCostPerKgbyProductId);
router.post("/edit-net-weight", authenticateUser, editProductNetWeightProductId);
router.post("/job-cost", authenticateUser, saveOrUpdateJobCost);
router.get("/fetch/job-cost/:rfqId/:skuId", authenticateUser, getJobCostsByRfqAndSku);
router.get("/calculate/sub-total-cost/:sku_id/:rfq_id", authenticateUser, calculateSubTotalCost);
router.delete("/delete/job-cost/:jobId/:skuId", authenticateUser, deleteJobCostBySkuJobId);

export default router;