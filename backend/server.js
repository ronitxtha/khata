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

import http from "http";                 // ✅ ADD
import { Server } from "socket.io";      // ✅ ADD

const app = express();
const PORT = process.env.PORT || 8000;

/* ================= SOCKET SETUP ================= */

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

// make io accessible inside controllers
app.set("io", io);

io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

/* ================= MIDDLEWARE ================= */

app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173",
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

/* ================= START SERVER ================= */

connectDB();

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
