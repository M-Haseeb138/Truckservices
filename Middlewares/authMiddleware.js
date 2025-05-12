// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const User = require("../Models/userModel");

// const verifyToken = async (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

//     if (!token) {
//         console.log("❌ No token provided");
//         return res.status(401).json({ message: "Access Denied. No token provided." });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         console.log("✅ Decoded Token:", decoded);

//         if (!decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
//             console.log("❌ Invalid userId in token");
//             return res.status(403).json({ message: "Invalid token structure" });
//         }

//         const user = await User.findById(decoded.userId).select("-password");
//         if (!user) {
//             console.log("❌ User not found in database");
//             return res.status(401).json({ message: "Unauthorized: User not found" });
//         }
//         req.user = { userId: new mongoose.Types.ObjectId(user._id) };
//         next();
//     } catch (error) {
//         console.error("❌ Token Verification Error:", error.message);
//         return res.status(403).json({ message: "Invalid token." });
//     }
// };

// module.exports = verifyToken;


const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../Models/userModel");

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Extract token (supports "Bearer" prefix or raw token)
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
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ [AUTH] Decoded Token:", decoded);

        // Validate token structure
        if (!decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
            console.log("❌ [AUTH] Invalid userId in token");
            return res.status(403).json({
                success: false,
                message: "Invalid token structure"
            });
        }

        // Fetch user and attach to request
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            console.log("❌ [AUTH] User not found in database");
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found"
            });
        }

        // Attach full user object to request
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