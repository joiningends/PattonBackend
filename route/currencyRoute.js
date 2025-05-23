import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteCurrency, editCurrency, getCurrency, saveCurrency } from "../controller/currencyController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveCurrency);
router.get("/fetch", authenticateUser, getCurrency);
router.post("/edit/:id", authenticateUser, editCurrency);
router.get("/delete/:id", authenticateUser, deleteCurrency);


export default router;