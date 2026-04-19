import express from "express";
import { getConversations, getChatHistory } from "../controllers/messageController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.get("/conversations", isAuthenticated, getConversations);
router.get("/:userId", isAuthenticated, getChatHistory);

export default router;
