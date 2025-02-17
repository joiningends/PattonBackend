import express from "express";
import { getClientDetails, saveClientData, updateClientData } from "../controller/clientController.js";

const router = express.Router();


router.post("/save", saveClientData);               // save client with other conatacts
router.get('/getall', getClientDetails);            // Get all clients
router.get('/get/:id', getClientDetails);           // Get specific client
router.put('/edit/:id', updateClientData);

export default router;