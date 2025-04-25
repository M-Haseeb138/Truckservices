const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const User = require("../Models/usermodel");

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
