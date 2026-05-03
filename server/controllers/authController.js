import admin from "../lib/firebaseAdmin.js";
import User from "../models/User.js";
import { generateToken } from "../lib/utils.js";

// Verify Firebase token and login/signup user
export const firebaseAuth = async (req, res) => {
    try {
        const { firebaseToken, fullName, profilePic, bio } = req.body;

        // Check if firebase token is provided
        if (!firebaseToken) {
            return res.status(400).json({ success: false, message: "Firebase token required" });
        }

        console.log("Token received, verifying...");

        // Verify the Firebase token using admin SDK
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        console.log("Decoded successfully:", decodedToken.uid);

        const { uid, phone_number, email, name, picture } = decodedToken;

        // Check if user already exists by firebase uid
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // Check if email already exists from OTP signup
            const existingEmailUser = await User.findOne({ email: email || `${uid}@firebase.com` });
            
            if (existingEmailUser) {
                // Link firebase uid to existing account
                existingEmailUser.firebaseUid = uid;
                if (picture && !existingEmailUser.profilePic) {
                    existingEmailUser.profilePic = picture;
                }
                await existingEmailUser.save();
                user = existingEmailUser;
            } else {
                // Brand new user — create account
                user = await User.create({
                    firebaseUid: uid,
                    fullName: fullName || name || phone_number || email,
                    email: email || `${uid}@firebase.com`,
                    phone: phone_number || null,
                    profilePic: profilePic || picture || "",
                    bio: bio || "Hey there! I am using HumbleTree.",
                    password: uid
                });
            }
        }

        // Generate our own JWT token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            userData: user,
            token,
            message: "Authentication successful"
        });

    } catch (error) {
        console.error("Firebase auth error:", error.message);
        res.status(401).json({ success: false, message: "Invalid Firebase token" });
    }
}