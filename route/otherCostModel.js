import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteOtherCost, editOtherCost, getOtherCost, saveOtherCost } from "../controller/otherCostController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveOtherCost);
router.get("/", authenticateUser, getOtherCost);
router.get("/:id", authenticateUser, getOtherCost);
router.post("/edit/:id", authenticateUser, editOtherCost);
router.get("/delete/:id", authenticateUser, deleteOtherCost);


export default router;