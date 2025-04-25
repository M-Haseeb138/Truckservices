const User = require("../Models/userModel");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

exports.Signup = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;
        const image = req.file?.path || null;

        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const normalizedEmail = email.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            fullName,
            email: normalizedEmail,
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

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Both email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not Found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const token = jwt.sign({ userid: user._id, useremail: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({ message: "Login Sucessful", token, user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
}


