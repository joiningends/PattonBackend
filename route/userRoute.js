import express from "express";
import { saveUserdata, getUserData, editUserData, enableDisableUser, deleteUser, mapUserWithRole, verifyEmail, sendEmailVerificationMail, getUserRoleDataByUserId, getNpdEngineer, getVendorEngineer, getProcessEngineer, getAllengineerByplantHeadId, getCommercialTeam, getAccountManagerByRFQid, getPlantHeadByengineer, getUserInfo, getEngineersByAssignment, getEngineersByAssignEngineers } from "../controller/userController.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/register", saveUserdata);                                      // Save user data
router.get("/", authenticateUser, getUserData);                              // fetch all users
router.post("/edit/:id", editUserData)                                       // Edit user by Id
router.post("/status/:id", enableDisableUser);                               // enable or disable user by Id
router.get("/delete/:id", deleteUser);                                       // delete user by Id
router.post("/map", mapUserWithRole);                                        // map user with role
router.get("/verify/email", verifyEmail);                                    // verify email
router.get("/send-email/verification", sendEmailVerificationMail);           // send email verification
router.get("/userRoledata/:id", getUserRoleDataByUserId);
router.get("/get-npdengineer/:p_user_id", getNpdEngineer);
router.get("/get-vendoreng/:p_user_id", getVendorEngineer);
router.get("/get-processeng/:p_user_id", getProcessEngineer);
router.get("/get-commercial-team", getCommercialTeam);
router.get("/get-allengineers/:p_user_id", getAllengineerByplantHeadId);
router.get("/:id", getUserData);                
router.get("/get-account-manager/:rfq_id", authenticateUser, getAccountManagerByRFQid);   
router.get("/get-plant-head/:engId", authenticateUser, getPlantHeadByengineer);        
router.get("/get-user-info/:roleId", authenticateUser, getUserInfo);
router.post("/get-engineers-review", authenticateUser, getEngineersByAssignment);  
router.post("/get-engineers-assign", authenticateUser, getEngineersByAssignEngineers);         

export default router; 