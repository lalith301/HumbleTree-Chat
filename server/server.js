import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app)

const allowedOrigins = [
    "https://humble-tree-chat.vercel.app",
    process.env.CLIENT_URL
]

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.includes("vercel.app")) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true
}

export const io = new Server(server, {
    cors: corsOptions
})

// Apply CORS before everything
app.use(cors(corsOptions))
app.use(express.json({ limit: "4mb" }));

export const userSocketMap = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userSocketMap[userId]) {
        const oldSocketId = userSocketMap[userId];
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) oldSocket.disconnect();
    }
    console.log("User Connected:", userId);
    if (userId) userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected:", userId);
        if (userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap))
        }
    })
})

app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)

await connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));

export default server;