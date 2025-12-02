import express from "express";
import 'dotenv/config';
import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import ownerRoutes from "./routes/ownerRoute.js"; // ✅ import owner routes
import cors from "cors";
import { verification } from "./controllers/userController.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Attach all /user routes
app.use('/user', userRoute);
app.get("/user/verify/:token", verification);

// Attach all /api/owner routes
app.use("/api/owner", ownerRoutes); // ✅ mount owner routes here

// Connect DB and start server
connectDB();
app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});
