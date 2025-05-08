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
router.get('/admins', AdminAuthController.getAllAdmins);
router.get('/admin/:adminId', AdminAuthController.getAdminById);
router.put('/admin/:adminId', upload.single('image'), AdminAuthController.updateAdmin);
router.delete('/admin/:adminId', AdminAuthController.deleteAdmin);

module.exports = router;





