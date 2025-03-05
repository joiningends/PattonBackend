import express from "express";
import { isFirstTimeLogin, LoginUser, resetPassword, resetPasswordMail } from "../controller/authController.js";


const router = express.Router();

router.post("/login", LoginUser);
router.post("/reset-password-mail", resetPasswordMail);
router.post("/reset-password", resetPassword);
router.post("/first-time-login", isFirstTimeLogin);

export default router;