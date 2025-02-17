import express from "express";
import { saveClientData } from "../controller/clientController.js";

const router = express.Router();


router.post("/save", saveClientData);


export default router;