import express from "express";
import { getClientDetails, saveClientData, updateClientData } from "../controller/clientController.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/save", authenticateUser, saveClientData);               // save client with other conatacts
router.get('/getall', authenticateUser, getClientDetails);            // Get all clients
router.get('/get/:id', authenticateUser, getClientDetails);           // Get specific client
router.put('/edit/:id', authenticateUser, updateClientData);

export default router;