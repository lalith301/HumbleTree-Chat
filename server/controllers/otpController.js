import User from "../models/User.js";
import { generateOTP, saveOTP, verifyOTP } from "../lib/otpStore.js";
import { sendOTPEmail } from "../lib/mailer.js";
import { generateToken } from "../lib/utils.js";

// Send OTP to email
export const sendEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Send OTP requested for:", email)

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Generate and save OTP
        const otp = generateOTP();
        saveOTP(email, otp);

        // Send OTP email
        await sendOTPEmail(email, otp);
        console.log(`OTP sent to ${email}: ${otp}`);

        res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("Send OTP error:", error.message);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
};

// Verify OTP and login/signup user
export const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp, fullName, profilePic, bio } = req.body;
        console.log("Verify OTP requested:", { email, otp, fullName })

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        // Handle VERIFIED flag (profile setup step)
        if (otp === 'VERIFIED') {
            if (!fullName) {
                return res.status(400).json({ success: false, message: "Name is required" });
            }

            // Check verified flag exists in store
            const result = verifyOTP(email, 'VERIFIED');
            if (!result.valid) {
                return res.status(400).json({ success: false, message: "Session expired. Please login again." });
            }

            // Create new user
            const user = await User.create({
                email,
                fullName,
                profilePic: profilePic || "",
                bio: bio || "Hey there! I am using HumbleTree.",
                password: email
            });

            const token = generateToken(user._id);
            return res.status(201).json({
                success: true,
                userData: user,
                token,
                isNewUser: true,
                message: "Account created successfully"
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        // Verify OTP
        const result = verifyOTP(email, otp);
        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.message });
        }

        // Existing user — login directly
        if (user) {
            const token = generateToken(user._id);
            return res.status(200).json({
                success: true,
                userData: user,
                token,
                isNewUser: false,
                message: "Login successful"
            });
        }

        // New user — go to profile setup
        // Save VERIFIED flag for profile step
        saveOTP(email, 'VERIFIED');
        return res.status(200).json({
            success: true,
            isNewUser: true,
            message: "OTP verified. Please complete your profile."
        });

    } catch (error) {
        console.error("Verify OTP error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};