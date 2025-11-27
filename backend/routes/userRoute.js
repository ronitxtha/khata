import express from "express";
import { loginUser, changePassword, registerUser, verification, logoutUser, forgotPassword, verifyOTP } from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { userSchema, validateUser } from "../validators/userValidate.js";

const router = express.Router();

router.post("/register",validateUser(userSchema), registerUser)
router.post("/verify", verification)
router.post("/login", loginUser)
router.post("/logout",isAuthenticated, logoutUser)
router.post("/forgot-password",forgotPassword)
router.post("/verify-otp/:email",verifyOTP)
router.post("/change-password/:email", changePassword) // To be implemented
router.get("/verify/:token", verification);



export default router;