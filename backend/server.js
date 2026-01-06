import express from "express";
import 'dotenv/config';
import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import ownerRoutes from "./routes/ownerRoute.js"; 
import cors from "cors";
import { verification } from "./controllers/userController.js";
import staffRoutes from "./routes/staffRoute.js";
import productRoutes from "./routes/productRoute.js";
import path from "path"; // ✅ add this
import shopRoutes from "./routes/shopRoutes.js";
import marketplaceRoute from "./routes/marketplaceRoute.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true
}));

// Serve uploads folder for images and QR codes
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use("/api/marketplace", marketplaceRoute);


app.use("/api/shops", shopRoutes);
// Attach all /user routes
app.use('/user', userRoute);
app.get("/user/verify/:token", verification);

app.use("/api/staff", staffRoutes);
app.use("/api", productRoutes); // customers

// Attach all /api/owner routes
app.use("/api/owner", ownerRoutes);

// Connect DB and start server
connectDB();
app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});
