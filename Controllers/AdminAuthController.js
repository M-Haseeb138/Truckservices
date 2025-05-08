const Admin = require("../Models/AdminModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../services/emailService");
const bcrypt = require("bcrypt");

exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;
        const image = req.file?.path || null;

        // Validation
        if (!fullName || !password || !phone) {
            return res.status(400).json({ success: false, message: "Full name, password, and phone number are required" });
        }

        if (!/^[0-9]{11}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Phone number must be 11 digits" });
        }

        // Check if phone or email already exists
        const existingAdmin = await Admin.findOne({ $or: [{ email }, { phone }] });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: "Admin already exists with this email or phone." });
        }

        // Create admin
        const admin = await Admin.create({
            fullName,
            email: email?.toLowerCase() || null,
            password,
            phone,
            image
        });

        // Generate token
        const token = jwt.sign(
            { adminId: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            token,
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                phone: admin.phone,
                image: admin.image,
                role: "admin"
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Signup failed", error: err.message });
    }
};
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(400).json({ success: false, message: "Invalid credentials (email not found)." });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials (password incorrect)." });
        }

        const token = jwt.sign(
            { adminId: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                phone: admin.phone,
                image: admin.image,
                role: "admin"
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login failed", error: err.message });
    }
};

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot Password (send OTP)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        const otpCode = generateOTP();
        admin.otpCode = otpCode;
        admin.otpExpires = Date.now() + 10 * 60 * 1000; // expires in 10 minutes
        admin.otpAttempts = 0;
        await admin.save();

        // Send email
        await sendEmail({
            to: admin.email,
            subject: "Your Password Reset Code",
            text: `Hello Admin,\n\nYour password reset code is: ${otpCode}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.\n\nThanks.`
        });

        res.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error("Forgot Password Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otpCode } = req.body;
    try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        if (admin.otpAttempts >= 5) {
            return res.status(403).json({ success: false, message: "Too many incorrect attempts. Try again later." });
        }

        if (!admin.otpCode || !admin.otpExpires) {
            return res.status(400).json({ success: false, message: "No OTP requested" });
        }

        if (Date.now() > admin.otpExpires) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        if (admin.otpCode !== otpCode) {
            admin.otpAttempts += 1;
            await admin.save();
            return res.status(400).json({ success: false, message: "Incorrect OTP" });
        }

        res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        console.error("Verify OTP Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        if (!admin.otpCode || !admin.otpExpires) {
            return res.status(400).json({ success: false, message: "No OTP requested" });
        }

        if (Date.now() > admin.otpExpires) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        if (admin.otpCode !== otpCode) {
            admin.otpAttempts += 1;
            await admin.save();
            return res.status(400).json({ success: false, message: "Incorrect OTP" });
        }

        // Update password
        admin.password = await bcrypt.hash(newPassword, 10);
        admin.otpCode = undefined;
        admin.otpExpires = undefined;
        admin.otpAttempts = 0;
        await admin.save();

        res.json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error("Reset Password Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
