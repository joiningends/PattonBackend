import express from "express";
import { LoginUser } from "../controller/authController.js";


const router = express.Router();

router.post("/login", LoginUser);


export default router;