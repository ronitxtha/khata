import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";

import { Shop } from "../models/shopModel.js";

// @desc    Get all conversations for the logged in user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        let currentUserId = req.userId;
        if (req.user && req.user.role === "staff") {
            const shop = await Shop.findById(req.user.shopId);
            if (shop) currentUserId = shop.ownerId;
        }

        // Find all messages where current user is sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
        }).sort({ createdAt: -1 }).populate("productId", "name image");

        // Extract unique users we have chatted with
        const conversationMap = new Map();

        for (const msg of messages) {
            const otherUserId = msg.senderId.toString() === currentUserId.toString() 
                ? msg.receiverId.toString() 
                : msg.senderId.toString();

            if (!conversationMap.has(otherUserId)) {
                conversationMap.set(otherUserId, {
                    lastMessage: msg,
                    unreadCount: (msg.receiverId.toString() === currentUserId.toString() && !msg.isRead) ? 1 : 0
                });
            } else {
                if (msg.receiverId.toString() === currentUserId.toString() && !msg.isRead) {
                    const conv = conversationMap.get(otherUserId);
                    conv.unreadCount += 1;
                    conversationMap.set(otherUserId, conv);
                }
            }
        }

        // Fetch user details for each conversation
        const activeConversations = [];
        for (const [otherUserId, data] of conversationMap) {
            const user = await User.findById(otherUserId).select("username profileImage role");
            if (user) {
                activeConversations.push({
                    user,
                    lastMessage: data.lastMessage,
                    unreadCount: data.unreadCount
                });
            }
        }

        res.status(200).json({ conversations: activeConversations });

    } catch (error) {
        console.error("Error in getConversations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get chat history between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
export const getChatHistory = async (req, res) => {
    try {
        const { userId: otherUserId } = req.params;
        let currentUserId = req.userId;
        if (req.user && req.user.role === "staff") {
            const shop = await Shop.findById(req.user.shopId);
            if (shop) currentUserId = shop.ownerId;
        }

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId }
            ]
        }).sort({ createdAt: 1 }).populate("productId", "name image");

        // Mark messages as read if receiver is current user
        await Message.updateMany(
            { senderId: otherUserId, receiverId: currentUserId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ messages });

    } catch (error) {
        console.error("Error in getChatHistory:", error);
        res.status(500).json({ message: "Server error" });
    }
};
