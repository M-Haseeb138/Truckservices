const express = require("express");
const router = express.Router();
const upload = require("../utils/multerConfig");
const AdminAuthController = require("../Controllers/AdminAuthController");

// Admin auth routes
router.post("/signup",upload.single("image"), AdminAuthController.signup);
router.post("/login", AdminAuthController.login);
router.post("/forgot-password", AdminAuthController.forgotPassword);
router.post("/verify-otp", AdminAuthController.verifyOtp);
router.post("/reset-password", AdminAuthController.resetPassword);

module.exports = router;





