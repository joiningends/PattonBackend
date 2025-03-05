import express from "express";
import { deletePlant, editPlant, getPlantData, savePlantData } from "../controller/plantController.js";
import authenticateUser from "../middleware/authMiddleware.js";



const router = express.Router();

router.post("/save", authenticateUser, savePlantData);                // save plant data
router.get("/", authenticateUser, getPlantData);                      // get all the plant data
router.get("/:id", authenticateUser, getPlantData);                   // get specific plant data
router.post("/edit/:id", authenticateUser, editPlant);                // edit plant data
router.get("/delete/:id", authenticateUser, deletePlant);             // delete plant data



export default router;