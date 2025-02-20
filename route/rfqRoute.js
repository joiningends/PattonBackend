import express from "express";
import { getRFQDetail, saveRFQandSKUdata } from "../controller/rfqController.js";

const router = express.Router();

router.post('/saverfq', saveRFQandSKUdata);
router.post("/getrfq", getRFQDetail);

export default router;