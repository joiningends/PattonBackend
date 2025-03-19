import { saveRolewithPermission, updateRolewithPermission, viewRolePermissions } from "../controller/roleController.js";
import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/save", authenticateUser, saveRolewithPermission);
router.put('/update', authenticateUser, updateRolewithPermission);
router.get('/view/:role_id', viewRolePermissions);
router.get('/view', authenticateUser, viewRolePermissions);


export default router;