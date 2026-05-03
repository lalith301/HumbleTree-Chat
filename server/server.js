import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
cconst app = express();
const server = http.createServer(app)

export const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "*" }
})

app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
}))

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    // If user already has a socket, disconnect the old one
    if (userSocketMap[userId]) {
        const oldSocketId = userSocketMap[userId];
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
            oldSocket.disconnect();
        }
    }

    console.log("User Connected:", userId);
    if (userId) userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected:", userId);
        // Only delete if this is still the current socket
        if (userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap))
        }
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());


// Routes setup
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)


// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));

// Export server for Vervel
export default server;
