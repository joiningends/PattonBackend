import express from "express";
import { saveUserdata, getUserData, editUserData, enableDisableUser, deleteUser, mapUserWithRole } from "../controller/userController.js";

const router = express.Router();


router.post("/register", saveUserdata);                 // Save user data
router.get("/", getUserData);                           // fetch all users
router.get("/:id", getUserData);                        // fecth user by Id
router.post("/edit/:id", editUserData)                  // Edit user by Id
router.post("/status/:id", enableDisableUser);          // enable or disable user by Id
router.get("/delete/:id", deleteUser);                  // delete user by Id
router.post("/map", mapUserWithRole);                   // map user with role

export default router;