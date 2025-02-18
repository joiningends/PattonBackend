import express from "express";
import { saveRFQandSKUdata } from "../controller/rfqController.js";

const router = express.Router();

router.post('/saverfq', saveRFQandSKUdata);

export default router;