import express from "express";
import { deleteRawMaterial, editRawMaterial, enableDiableRawMaterial, getRawMaterial, saveRawmaterial } from "../controller/rawMaterialController.js";


const router = express.Router();


router.post("/save", saveRawmaterial);
router.get("/", getRawMaterial);
router.get("/:id", getRawMaterial);
router.post("/edit/:id", editRawMaterial);
router.get("/status/:id", enableDiableRawMaterial);
router.get("/delete/:id", deleteRawMaterial);

export default router;
