import mongoose from "mongoose";
import dotenv from "dotenv";
import { Notification } from "./models/notificationModel.js";
dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    try {
        const notifs = await Notification.find().sort({createdAt: -1}).limit(5);
        for(let n of notifs) {
            console.log(n._id, "Message:", n.message, "readBy:", n.readBy, "isRead:", n.isRead);
        }
    } catch(e) {
        console.error(e);
    }
    mongoose.disconnect();
});
