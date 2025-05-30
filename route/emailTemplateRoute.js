import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteEmailTemplate, editEmailTemplate, fetchEmailTemplate, fetchEmailTemplateTags, getEmailTemplateByTag, saveEmailTemplate, saveEmailWithtags } from "../controller/emailTemplateController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveEmailTemplate);
router.get("/fetch", authenticateUser, fetchEmailTemplate);
router.post("/edit/:id", authenticateUser, editEmailTemplate);
router.get("/delete/:id", authenticateUser, deleteEmailTemplate);

router.get("/email-tags", authenticateUser, fetchEmailTemplateTags);
router.post("/email-tag-assign", authenticateUser, saveEmailWithtags);
router.get("/email-with-tag/:tagId", authenticateUser, getEmailTemplateByTag);

export default router;