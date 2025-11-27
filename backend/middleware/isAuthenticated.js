import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing or invalid",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        req.userId = user._id;
        req.user = user;
        next();
        
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                error.name === "TokenExpiredError"
                    ? "Access token expired, generate a new one"
                    : "Access token is invalid",
        });
    }
};
