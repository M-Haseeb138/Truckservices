const express = require("express");
const router = express.Router();
const upload = require("../utils/multerConfig");
const AdminAuthController = require("../Controllers/AdminAuthController");
const verifyAdmin = require("../Middlewares/adminAuthMiddleware")

// Admin auth routes
router.post("/signup",upload.single("image"), AdminAuthController.signup);
router.post("/login", AdminAuthController.login);
router.post("/forgot-password", AdminAuthController.forgotPassword);
router.post("/verify-otp", AdminAuthController.verifyOtp);
router.post("/reset-password", AdminAuthController.resetPassword);
router.get('/admins', verifyAdmin,AdminAuthController.getAllAdmins);
router.get('/admin',verifyAdmin, AdminAuthController.getAdminById);
router.put('/admin/:adminId',verifyAdmin, upload.single('image'), AdminAuthController.updateAdmin);
router.delete('/admin/:adminId',verifyAdmin, AdminAuthController.deleteAdmin);
router.post('/adminauth/logout',verifyAdmin, AdminAuthController.logout);


module.exports = router;





