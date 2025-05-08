const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("../Models/AdminModel");

const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
        ? authHeader.split(" ")[1] 
        : authHeader;

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.adminId || !mongoose.Types.ObjectId.isValid(decoded.adminId)) {
            return res.status(403).json({ success: false, message: "Invalid token structure." });
        }

        const admin = await Admin.findById(decoded.adminId).select("-password");
        if (!admin) {
            return res.status(401).json({ success: false, message: "Admin not found." });
        }

        req.admin = { adminId: admin._id };
        next();
    } catch (error) {
        console.error("Token error:", error.message);
        return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
};

module.exports = verifyAdminToken;
