// In-memory OTP store { email: { otp, expiresAt } }
const otpStore = {};

// Generate a 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP with expiry — VERIFIED flag gets longer expiry
export const saveOTP = (email, otp) => {
    const isVerified = otp === 'VERIFIED';
    otpStore[email] = {
        otp,
        // VERIFIED flag lasts 10 minutes, regular OTP 10 minutes
        expiresAt: Date.now() + 10 * 60 * 1000
    };
};

// Verify OTP
export const verifyOTP = (email, otp) => {
    const record = otpStore[email];

    // Check if OTP exists
    if (!record) {
        return { valid: false, message: "OTP not found. Please request a new one." };
    }

    // Check if expired
    if (Date.now() > record.expiresAt) {
        delete otpStore[email];
        return { valid: false, message: "OTP expired. Please request a new one." };
    }

    // Check if matches
    if (record.otp !== otp) {
        return { valid: false, message: "Invalid OTP. Please try again." };
    }

    // Valid — delete so it can't be reused
    delete otpStore[email];
    return { valid: true };
};