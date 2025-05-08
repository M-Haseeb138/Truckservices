const Admin = require("../Models/AdminModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../services/emailService");
const bcrypt = require("bcrypt");

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
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

        await sendEmail({
            to: admin.email,
            subject: "Password Reset Code (TruckServices)",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Hello Admin,</h2>
                <p>Your password reset code is:</p>
                <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">${otpCode}</div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you did not request this, please ignore this email.</p>
                <br/>
                <p>Thanks,<br/>TruckServices Team</p>
              </div>
            `,
          });

        res.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error("Forgot Password Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        // First check if OTP and expiry exist
        if (!admin.otpCode || !admin.otpExpires) {
            return res.status(400).json({ success: false, message: "No OTP generated" });
        }

        // Compare OTPs (convert to string to avoid type mismatch)
        if (admin.otpCode !== otpCode.toString()) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        // Check if OTP expired
        if (admin.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP has expired" });
        }

        // ✅ Mark OTP as verified
        admin.isOtpVerified = true;
        admin.otpCode = undefined; // clear OTP
        admin.otpExpires = undefined;
        admin.otpAttempts = 0; // optional: reset attempts

        await admin.save();

        res.status(200).json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        if (!admin.isOtpVerified) {
            return res.status(400).json({ success: false, message: "OTP not verified. Please verify OTP first." });
        }

        const isSamePassword = await bcrypt.compare(newPassword, admin.password);
        if (isSamePassword) {
            return res.status(400).json({ success: false, message: "New password must be different from old password" });
        }

        // ⚡ Don't manually hash here
        admin.password = newPassword;

        admin.isOtpVerified = false;

        await admin.save(); // auto-hash because of pre("save")

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getAllAdmins = async (req, res) => {
    try {
      const admins = await Admin.find().select("-password"); // Don't send password
  
      res.status(200).json({
        success: true,
        admins
      });
    } catch (error) {
      console.error("Get All Admins Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  exports.getAdminById = async (req, res) => {
    try {
      const { adminId } = req.params;
  
      const admin = await Admin.findById(adminId).select("-password"); // hide password
  
      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
  
      res.status(200).json({
        success: true,
        admin
      });
    } catch (error) {
      console.error("Get Admin By ID Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  exports.deleteAdmin = async (req, res) => {
    try {
      const { adminId } = req.params;
  
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
  
      await Admin.findByIdAndDelete(adminId);
  
      res.status(200).json({
        success: true,
        message: "Admin deleted successfully"
      });
    } catch (error) {
      console.error("Delete Admin Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  exports.updateAdmin = async (req, res) => {
    try {
      const { adminId } = req.params;
      const { fullName, email, phone } = req.body;
      const image = req.file?.path || undefined;
  
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
  
      if (fullName) admin.fullName = fullName;
      if (email) admin.email = email.toLowerCase();
      if (phone) admin.phone = phone;
      if (image) admin.image = image;
  
      await admin.save();
  
      res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          image: admin.image,
        }
      });
    } catch (error) {
      console.error("Update Admin Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  