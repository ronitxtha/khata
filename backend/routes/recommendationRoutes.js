import express from "express";
import jwt from "jsonwebtoken";
import {
  getRecommendations,
  trackInteraction
} from "../controllers/recommendationController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { User } from "../models/userModel.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const user = await User.findById(decoded.id).select("-password");
      req.user = user;
      req.userId = user._id;
    }
  } catch (error) {
    // User is anonymous
  }
  
  next();
}, getRecommendations);

router.post("/track", isAuthenticated, trackInteraction);

export default router;
