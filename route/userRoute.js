import express from "express";
import { saveUserdata, getUserData, editUserData, disableUser, deleteUser } from "../controller/userController.js";

const router = express.Router();


router.post("/register", saveUserdata);                 // Save user data
router.get("/", getUserData);                           // fetch all users
router.get("/:id", getUserData);                        // fecth user by Id
router.post("/edit/:id", editUserData)                  // Edit user by Id
router.get("/disable/:id", disableUser);                // disable user by Id
router.get("/delete/:id", deleteUser)                   // delete user by Id

export default router;