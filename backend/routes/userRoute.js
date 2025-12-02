import express from "express";
import { loginUser, changePassword, registerUser, verification, logoutUser, forgotPassword, verifyOTP } from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { userSchema, validateUser } from "../validators/userValidate.js";
import { Shop } from "../models/shopModel.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.post("/register",validateUser(userSchema), registerUser)
router.post("/verify", verification)
router.post("/login", loginUser)
router.post("/logout",isAuthenticated, logoutUser)
router.post("/forgot-password",forgotPassword)
router.post("/verify-otp/:email",verifyOTP)
router.post("/change-password/:email", changePassword) // To be implemented
router.get("/verify/:token", verification);

router.post("/register-owner", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);

        // Create owner user
        const owner = await User.create({
            username,
            email,
            password: hashed,
            role: "owner"
        });

        // Create shop
        const shop = await Shop.create({
            name: `${username}'s Shop`,
            ownerId: owner._id
        });

        // Link shop to owner
        owner.shopId = shop._id;
        await owner.save();

        res.json({
            message: "Owner and shop created successfully",
            owner,
            shop
        });
        
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});


export default router;