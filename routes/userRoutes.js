const express = require("express");
const router = express.Router();
const upload = require("../utils/multerConfig");
const authController = require("../Controllers/userController");
const verifyToken = require("../Middlewares/authMiddleware");

router.post("/signup", upload.single("image"), authController.signup);
router.post("/login", authController.login);
router.get("/getuser", verifyToken, authController.getUser);
router.put("/updateuser", verifyToken, upload.single("image"), authController.updateUser);
router.delete("/deleteuser", verifyToken, authController.deleteUser);
router.post("/logout", verifyToken, authController.logout);

module.exports = router;

