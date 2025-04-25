const express = require("express");
const router = express.Router();
const upload = require("../utils/multerConfig"); // 👈 use your existing config
const userController = require("../Controllers/userController");
const verifyToken = require("../Middlewares/authMiddleware");

router.post("/signup", upload.single("image"), userController.Signup);
router.post("/login", userController.login);
router.get("/getuser",verifyToken,userController.getUser)

module.exports = router;
