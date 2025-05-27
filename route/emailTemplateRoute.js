import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteEmailTemplate, editEmailTemplate, fetchEmailTemplate, saveEmailTemplate } from "../controller/emailTemplateController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveEmailTemplate);
router.get("/fetch", authenticateUser, fetchEmailTemplate);
router.post("/edit/:id", authenticateUser, editEmailTemplate);
router.get("/delete/:id", authenticateUser, deleteEmailTemplate);

export default router;