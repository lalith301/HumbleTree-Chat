import express from "express";
import { checkAuth, login, signup, updateProfile } from "../controllers/userController.js";
import { firebaseAuth } from "../controllers/authController.js";
import { sendEmailOTP, verifyEmailOTP } from "../controllers/otpController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

// Email/password routes
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

// Firebase (Google OAuth) route
userRouter.post("/firebase", firebaseAuth);

// Email OTP routes
userRouter.post("/send-otp", sendEmailOTP);
userRouter.post("/verify-otp", verifyEmailOTP);

export default userRouter;