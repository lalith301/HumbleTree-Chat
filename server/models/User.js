import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
    fullName: { type: String, required: true },
    password: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "Hey there! I am using HumbleTree." },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;