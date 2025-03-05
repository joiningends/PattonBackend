import express from "express";
import { deletePage, enableDisablePage, editPageData, getPageData, savePageData } from "../controller/pageController.js";
import authenticateUser from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/save", authenticateUser, savePageData);                     // Save page data
router.get("/", authenticateUser, getPageData);                           // fetch all pages
router.get("/:id", authenticateUser, getPageData);                        // fetch page by Id
router.post("/edit/:id", authenticateUser, editPageData);                 // edit page by Id
router.post("/status/:id", authenticateUser, enableDisablePage);          // enable or diable page by Id
router.get("/delete/:id", authenticateUser, deletePage);                  // delete page by Id


export default router;