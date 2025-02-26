import express from "express";
import { deletePlant, editPlant, getPlantData, savePlantData } from "../controller/plantController.js";



const router = express.Router();

router.post("/save", savePlantData);                // save plant data
router.get("/", getPlantData);                      // get all the plant data
router.get("/:id", getPlantData);                   // get specific plant data
router.post("/edit/:id", editPlant);                // edit plant data
router.get("/delete/:id", deletePlant);             // delete plant data



export default router;