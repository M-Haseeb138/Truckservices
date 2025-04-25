const User = require("../Models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// SIGNUP
exports.Signup = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const image = req.file?.path || null;

    if (!fullName || !password || !phone) {
      return res.status(400).json({ message: "Full name, password, and phone number are required" });
    }

    if (!/^[0-9]{11}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be 11 digits" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email: email?.toLowerCase() || null,
      phone,
      password: hashedPassword,
      image
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Both phone number and password are required" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { userId: user._id, userPhone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET USER
exports.getUser = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};
