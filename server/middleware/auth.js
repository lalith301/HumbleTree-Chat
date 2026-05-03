import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes - verifies JWT token before allowing access
export const protectRoute = async (req, res, next) => {
    try {
        // Check if Authorization header exists and starts with "Bearer"
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized - No token" });
        }

        // Extract the token from "Bearer <token>"
        const token = authHeader.split(" ")[1];

        // Verify the token using the JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user from the decoded token's userId
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Attach user to request object so controllers can access it
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
    }
}