import express from "express";
import { deleteRawMaterial, editRawMaterial, enableDiableRawMaterial, getRawMaterial, saveRawmaterial } from "../controller/rawMaterialController.js";
import authenticateUser from "../middleware/authMiddleware.js";


const router = express.Router();


router.post("/save", authenticateUser, saveRawmaterial);
router.get("/", authenticateUser, getRawMaterial);
router.get("/:id", authenticateUser, getRawMaterial);
router.post("/edit/:id", authenticateUser, editRawMaterial);
router.get("/status/:id", authenticateUser, enableDiableRawMaterial);
router.get("/delete/:id", authenticateUser, deleteRawMaterial);

export default router;
