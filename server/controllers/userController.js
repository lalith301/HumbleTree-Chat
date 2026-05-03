import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js"

// Controller to signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;
    try {
        // Check if all required fields are provided
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        // Check if user already exists with the same email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Account already exists" })
        }

        // Hash the password before saving to database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user in database
        const newUser = await User.create({ fullName, email, password: hashedPassword, bio });

        // Generate JWT token for the new user
        const token = generateToken(newUser._id);

        res.status(201).json({ success: true, userData: newUser, token, message: "Account created successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        // Check if user exists with the provided email
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(401).json({ success: false, message: "Invalid credentials" })
        }

        // Compare provided password with hashed password in database
        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Generate JWT token for the logged in user
        const token = generateToken(userData._id);

        res.status(200).json({ success: true, userData, token, message: "Login successful" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    // req.user is set by the protectRoute middleware
    res.status(200).json({ success: true, user: req.user });
}

// Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        let updatedUser;

        // If no profile picture, just update bio and fullName
        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
        } else {
            // Upload profile picture to cloudinary and get the URL
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, bio, fullName }, { new: true });
        }

        res.status(200).json({ success: true, user: updatedUser })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}