import express from "express";
import { isFirstTimeLogin, LoginUser, resetPassword, resetPasswordMail, validateToken } from "../controller/authController.js";


const router = express.Router();

router.post("/login", LoginUser);                                       // Login user 
router.post("/reset-password-mail", resetPasswordMail);                 // Send mail for reset password
router.post("/reset-password", resetPassword);                          // Reset password
router.post("/first-time-login", isFirstTimeLogin);                     // First time login logic
router.get("/validate-token", validateToken);                           // Validating user token

export default router;