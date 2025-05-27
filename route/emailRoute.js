import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteEmailConfig, editEmailConfig, fetchEmailConfig, saveEmailConfig, sendBatchEmailNotifications, sendEmailNotification } from "../controller/emailController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveEmailConfig);
router.get("/fetch", authenticateUser, fetchEmailConfig);
router.post("/edit/:id", authenticateUser, editEmailConfig);
router.get("/delete/:id", authenticateUser, deleteEmailConfig);

// Send email notifiacation route
router.post("/notify", authenticateUser, sendEmailNotification);
router.post("/notify-batch", authenticateUser, sendBatchEmailNotifications);

export default router;