import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { deleteJobType, editJobType, getJobType, saveJobTypes } from "../controller/jobController.js";


const router = express.Router();

router.post("/save", authenticateUser, saveJobTypes);
router.get("/", authenticateUser, getJobType);
router.get("/:id", authenticateUser, getJobType);
router.post("/edit/:id", authenticateUser, editJobType);
router.get("/delete/:id", authenticateUser, deleteJobType);



export default router;
