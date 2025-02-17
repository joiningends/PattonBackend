import { saveRolewithPermission, updateRolewithPermission, viewRolePermissions } from "../controller/roleController.js";
import express from "express";

const router = express.Router();

router.post("/save", saveRolewithPermission);
router.put('/update', updateRolewithPermission);
router.get('/view/:role_id', viewRolePermissions);
router.get('/view', viewRolePermissions);


export default router;