const User = require("../Models/userModel");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");


exports.Signup = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;
        const image = req.file?.path || null;

        // Validate phone number length (11 digits)
        if (!/^[0-9]{11}$/.test(phone)) {
            return res.status(400).json({ message: "Phone number must be 11 digits" });
        }

        // Ensure all required fields are present
        if (!fullName || !password || !phone) {
            return res.status(400).json({ message: "Full name, password, and phone number are required" });
        }

        // Check if the phone number already exists in the database
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: "Phone number is already registered" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const user = new User({
            fullName,
            email: email?.toLowerCase() || null, // If email is not provided, make sure it's null
            phone,
            password: hashedPassword,
            image
        });

        // Save the user to the database
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate login fields
        if (!phone || !password) {
            return res.status(400).json({ message: "Both phone number and password are required" });
        }

        // Check if the user exists with the provided phone number
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Compare the password with the hashed password stored in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create a JWT token
        const token = jwt.sign({ userid: user._id, userphone: user.phone }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, fullName: user.fullName, phone: user.phone }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



