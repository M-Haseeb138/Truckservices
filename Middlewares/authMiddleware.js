const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../Models/userModel");

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;
    if (!token) {
        console.log("❌ [AUTH] No token provided");
        return res.status(401).json({
            success: false,
            message: "Access Denied. No token provided."
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ [AUTH] Decoded Token:", decoded);
        if (!decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
            console.log("❌ [AUTH] Invalid userId in token");
            return res.status(403).json({
                success: false,
                message: "Invalid token structure"
            });
        }
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            console.log("❌ [AUTH] User not found in database");
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found"
            });
        }
        req.user = {
            userId: user._id,
            role: user.role
        };

        console.log(`✅ [AUTH] Authenticated ${user.role} ${user._id}`);
        next();
    } catch (error) {
        console.error("❌ [AUTH] Token Verification Error:", error.message);

        const message = error.name === 'TokenExpiredError'
            ? "Token expired"
            : "Invalid token";

        return res.status(403).json({
            success: false,
            message
        });
    }
};

module.exports = verifyToken;