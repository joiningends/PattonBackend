import { saveRolewithPermission } from "../controller/roleController.js";
import express from "express";

const router = express.Router();

router.post("/save", saveRolewithPermission);


export default router;