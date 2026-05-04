import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    }
});

export const sendOTPEmail = async (email, otp) => {
    await transporter.sendMail({
        from: `"HumbleTree" <${process.env.BREVO_USER}>`,
        to: email,
        subject: 'Your HumbleTree verification code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #111b21; color: #e9edef; padding: 40px; border-radius: 12px;">
                <h1 style="color: #00a884; text-align: center;">HumbleTree</h1>
                <p style="color: #e9edef;">Your verification code is:</p>
                <div style="background: #202c33; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                    <h2 style="color: #00a884; font-size: 40px; letter-spacing: 12px; margin: 0;">${otp}</h2>
                </div>
                <p style="color: #8696a0; font-size: 14px;">Expires in 10 minutes.</p>
            </div>
        `
    });
};