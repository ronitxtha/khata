import express from "express";
import 'dotenv/config';
import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import ownerRoutes from "./routes/ownerRoute.js";
import cors from "cors";
import { verification } from "./controllers/userController.js";
import staffRoutes from "./routes/staffRoute.js";
import productRoutes from "./routes/productRoute.js";
import path from "path";
import shopRoutes from "./routes/shopRoutes.js";
import marketplaceRoute from "./routes/marketplaceRoute.js";
import "./cronJobs/endOfDayAttendance.js";
import userAddressRoute from "./routes/userAddressRoute.js";
import orderRoutes from "./routes/orderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import customerProfileRoutes from "./routes/customerProfileRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

import http from "http";
import { Server } from "socket.io";
import messageRoutes from "./routes/messageRoute.js";
import { Message } from "./models/messageModel.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { User } from "./models/userModel.js";
import bcrypt from "bcryptjs";

const app = express();
const PORT = process.env.PORT || 8000;

/* ================= SOCKET SETUP ================= */

const server = http.createServer(app);

// Allowed origins: production Vercel URL + local dev
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
].filter(Boolean); // remove undefined if FRONTEND_URL not set

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// make io accessible inside controllers
app.set("io", io);

const userSockets = new Map();

io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // Register user socket mapping
    socket.on("register", (userId) => {
        if (userId) {
            userSockets.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        }
    });

    // Handle incoming messages
    socket.on("send_message", async (data) => {
        const fs = await import("fs");
        fs.appendFileSync("socket_debug.log", new Date().toISOString() + " - " + JSON.stringify(data) + "\n");
        console.log("Socket received send_message:", data);
        try {
            const { senderId, receiverId, productId, text } = data;
            
            // Save to database
            const newMessage = new Message({
                senderId,
                receiverId,
                productId: productId || null,
                text
            });
            await newMessage.save();

            // Populate sender details for immediate display
            await newMessage.populate("senderId", "username profileImage");
            
            // Send to receiver if online
            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", newMessage);
            }
            
            // Send back to sender to confirm
            socket.emit("message_sent", newMessage);
            fs.appendFileSync("socket_debug.log", "Sent successfully\n");
            
        } catch (error) {
            fs.appendFileSync("socket_debug.log", "ERROR: " + error.message + "\n");
            console.error("Socket send_message error:", error);
            socket.emit("message_error", { error: "Failed to send message" });
        }
    });

    // Handle read receipt
    socket.on("mark_read", async ({ senderId, receiverId }) => {
        try {
            // Update all unread messages from this sender to this receiver
            await Message.updateMany(
                { senderId, receiverId, isRead: false },
                { $set: { isRead: true } }
            );
            
            const senderSocketId = userSockets.get(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("messages_read", { readerId: receiverId });
            }
        } catch (error) {
            console.error("Socket mark_read error:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
        // Remove user from map
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
});

/* ================= MIDDLEWARE ================= */

app.use(express.json());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));

app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use("/api/marketplace", marketplaceRoute);
app.use("/api/shops", shopRoutes);
app.use('/user', userRoute);
app.get("/user/verify/:token", verification);
app.use("/api/staff", staffRoutes);
app.use("/api", productRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/user", userAddressRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/customer", customerProfileRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/admin", adminRoutes);

/* ================= START SERVER ================= */

// ── Seed admin user on startup ───────────────────────────────────────────────
const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ role: "admin" });
    if (!exists) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await User.create({
        username: "Admin",
        email: process.env.ADMIN_EMAIL,
        password: hashed,
        role: "admin",
        isVerified: true,
        isActive: true,
      });
      console.log(`✅ Admin seeded: ${process.env.ADMIN_EMAIL}`);
    } else {
      console.log(`ℹ️  Admin already exists: ${exists.email}`);
    }
  } catch (err) {
    console.error("❌ Admin seed failed:", err.message);
  }
};

connectDB().then(seedAdmin);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
