import express from "express";
import { deletePage, enableDisablePage, editPageData, getPageData, savePageData } from "../controller/pageController.js";


const router = express.Router();

router.post("/save", savePageData);                     // Save page data
router.get("/", getPageData);                           // fetch all pages
router.get("/:id", getPageData);                        // fetch page by Id
router.post("/edit/:id", editPageData);                 // edit page by Id
router.post("/status/:id", enableDisablePage);          // enable or diable page by Id
router.get("/delete/:id", deletePage);                  // delete page by Id


export default router;