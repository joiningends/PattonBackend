import express from "express";
import { calculateLatestSubTotalCost, calculateSubTotalCost, deleteJobCostBySkuJobId, deleteProductById, editBomCostPerKgbyProductId, editBomCostPerkgByProductId, editLatestBomCostPerKgbyProductId, editLatestProductNetWeightProductId, editLatestYieldPercentageByProductId, editNetWeightOfProductByProductId, editProductNetWeightProductId, editYieldPercbyProductId, editYieldPercentageByProductId, getAllSKU, getJobCostsByRfqAndSku, getLatestJobCostsByRfqAndSku, getlatestSKUbyRFQid, getProductsBySKUId, getSKUbyRFQid, reCalculateCifValue, reCalculateLatestCifValue, saveAllCostsAndCalculateCIF, saveBOMProductswithSKUdetails, saveCalculateLatestOverheadPercentage, saveCalculateOverheadPercentage, saveLatestAllCostsAndCalculateCIF, saveLatestMarginAndCalculateTotalCost, saveMarginAndCalculateTotalCost, saveOrUpdateJobCost, saveOrUpdateLatestJobCost, saveProductswithSKUdetails, setClientCurrencyCost, setLatestClientCurrencyCost, updateAssemblyWeightBySkuid } from "../controller/skuController.js";
import authenticateUser from "../middleware/authMiddleware.js";


const router = express.Router();


router.get("/getsku/:rfqId", authenticateUser, getSKUbyRFQid);
router.get("/getlatestsku/:rfqId", authenticateUser, getlatestSKUbyRFQid);
router.post("/saveproducts", authenticateUser, saveProductswithSKUdetails);
router.post("/save-bomproducts", authenticateUser, saveBOMProductswithSKUdetails);
router.get("/getproducts/:p_sku_id", authenticateUser, getProductsBySKUId);
router.delete("/deleteproduct/:product_id", authenticateUser, deleteProductById);
router.post("/edit/yield-percentage", authenticateUser, editYieldPercentageByProductId);
router.post("/edit/bomcostperkg", authenticateUser, editBomCostPerkgByProductId);
router.post("/edit/netweight-product", authenticateUser, editNetWeightOfProductByProductId);
router.get("/calculate-assembly/:sku_id", authenticateUser, updateAssemblyWeightBySkuid);
router.post("/edit-yield", authenticateUser, editYieldPercbyProductId);
router.post("/edit-latest-yield", authenticateUser, editLatestYieldPercentageByProductId);
router.post("/edit-bom-cost", authenticateUser, editBomCostPerKgbyProductId);
router.post("/edit-latest-bom-cost", authenticateUser, editLatestBomCostPerKgbyProductId);
router.post("/edit-net-weight", authenticateUser, editProductNetWeightProductId);
router.post("/edit-latest-net-weight", authenticateUser, editLatestProductNetWeightProductId);
router.post("/job-cost", authenticateUser, saveOrUpdateJobCost);
router.post("/job-cost-latest", authenticateUser, saveOrUpdateLatestJobCost);
router.get("/fetch/job-cost/:rfqId/:skuId", authenticateUser, getJobCostsByRfqAndSku);
router.get("/fetch/job-cost-latest/:rfqId/:skuId", authenticateUser, getLatestJobCostsByRfqAndSku);
router.get("/calculate/sub-total-cost/:sku_id/:rfq_id", authenticateUser, calculateSubTotalCost);
router.get("/calculate/sub-total-cost-latest/:sku_id/:rfq_id", authenticateUser, calculateLatestSubTotalCost);
router.delete("/delete/job-cost/:jobId/:skuId", authenticateUser, deleteJobCostBySkuJobId);
router.post("/overhead/value", authenticateUser, saveCalculateOverheadPercentage);
router.post("/overhead/value-latest", authenticateUser, saveCalculateLatestOverheadPercentage);
router.post("/freight-insurance/cal-cif", authenticateUser, saveAllCostsAndCalculateCIF);
router.post("/freight-insurance/cal-cif-latest", authenticateUser, saveLatestAllCostsAndCalculateCIF);
router.post("/margin/total-cost", authenticateUser, saveMarginAndCalculateTotalCost);
router.post("/margin-latest/total-cost", authenticateUser, saveLatestMarginAndCalculateTotalCost);
router.post("/client-currency/cost", authenticateUser, setClientCurrencyCost);
router.post("/client-currency/cost-latest", authenticateUser, setLatestClientCurrencyCost);
router.get("/recalculate/cif/:p_sku_id", authenticateUser, reCalculateCifValue);
router.get("/recalculate/cif-latest/:p_sku_id", authenticateUser, reCalculateLatestCifValue);
// router.get("/recalculate/factory-overhead", authenticateUser, calculateFactoryOverheadCost);
router.get("/get-all/skus", getAllSKU);


export default router;