import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js"
import { io, userSocketMap } from "../server.js";

// Get all users except the logged in user + unseen message counts
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        const unseenMessages = {}
        const lastMessages = {}

        const promises = filteredUsers.map(async (user) => {
            // Get unseen count
            const unseen = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (unseen.length > 0) unseenMessages[user._id] = unseen.length;

            // Get last message time between these two users
            const lastMsg = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: user._id },
                    { senderId: user._id, receiverId: userId }
                ]
            }).sort({ createdAt: -1 }).select('createdAt text image')

            if (lastMsg) {
                lastMessages[user._id] = lastMsg.createdAt
            }
        })

        await Promise.all(promises);

        // Sort users by last message time
        const sortedUsers = filteredUsers.sort((a, b) => {
            const aTime = lastMessages[a._id] || 0
            const bTime = lastMessages[b._id] || 0
            return new Date(bTime) - new Date(aTime)
        })

        res.status(200).json({ success: true, users: sortedUsers, unseenMessages, lastMessages })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get all messages between logged in user and selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        // Fetch all messages between the two users in both directions
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        })

        // Mark all messages from selected user to logged in user as seen
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

        res.status(200).json({ success: true, messages })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Mark a specific message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;

        // Find message by id and update seen status to true
        await Message.findByIdAndUpdate(id, { seen: true })

        res.status(200).json({ success: true })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Send a message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        // Validate that message has either text or image
        if (!text && !image) {
            return res.status(400).json({ success: false, message: "Message cannot be empty" })
        }

        // If image is provided, upload to cloudinary and get the URL
        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        // Save the new message to database
        const newMessage = await Message.create({ senderId, receiverId, text, image: imageUrl })

        // Emit the new message to receiver in real-time via socket if they are online
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).json({ success: true, newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}