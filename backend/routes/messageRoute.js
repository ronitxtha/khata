import express from "express";
import { getConversations, getChatHistory } from "../controllers/messageController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import multer from "multer";
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// Multer setup for message image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/messages";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.get("/conversations", isAuthenticated, getConversations);
router.post("/upload", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const url = await uploadToCloudinary(req.file.path, "messages");
    res.status(200).json({ url });
  } catch (err) {
    console.error("Message image upload error:", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
});
router.get("/:userId", isAuthenticated, getChatHistory);

export default router;
