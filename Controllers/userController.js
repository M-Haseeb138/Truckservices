const User = require("../Models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, phone, CNIC, role } = req.body;
        const image = req.file?.path || null;

        if (!fullName || !password || !phone || !CNIC) {
            return res.status(400).json({ message: "Full name, password, phone number, and CNIC are required" });
        }

        if (!/^[0-9]{11}$/.test(phone)) {
            return res.status(400).json({ message: "Phone number must be exactly 11 digits" });
        }

        if (!/^[0-9]{13}$/.test(CNIC)) {
            return res.status(400).json({ message: "CNIC must be exactly 13 digits" });
        }

        // Check if phone or CNIC already exists
        const existingUser = await User.findOne({ $or: [{ phone }, { CNIC }] });
        if (existingUser) {
            return res.status(400).json({ message: "Phone number or CNIC is already registered" });
        }

        if (email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({ message: "Email already registered" });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            fullName,
            email: email?.toLowerCase() || null,
            phone,
            password: hashedPassword,
            image,
            CNIC,
            role: role || 'customer'
    
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, userPhone: user.phone },
            process.env.JWT_SECRET
            // { expiresIn: "1d" }
        );

        res.status(201).json({ 
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                CNIC: user.CNIC,
                role: user.role,
                image:user.image

        
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
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
            process.env.JWT_SECRET
            // { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                CNIC: user.CNIC,
                role: user.role,
                 image:user.image,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.getUser = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Fetched user: ", user); // 🔥 DEBUGGING

        res.status(200).json({
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            CNIC: user.CNIC,  // 🔥 manually picking CNIC
            image: user.image,
            role: user.role,
            isApproved: user.isApproved,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};
exports.updateUser = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        const { fullName, email, phone, CNIC, role, ...otherFields } = req.body;
        const updateData = {};

        if (fullName) updateData.fullName = fullName;

        if (email) {
            const user = await User.findById(userId);
            if (user.email !== email.toLowerCase()) {
                const existingEmail = await User.findOne({ email: email.toLowerCase() });
                if (existingEmail && existingEmail._id.toString() !== userId) {
                    return res.status(400).json({ message: "Email already in use" });
                }
                updateData.email = email.toLowerCase();
            }
        }

        if (phone) {
            const user = await User.findById(userId);
            if (user.phone !== phone) {
                if (!/^[0-9]{11}$/.test(phone)) {
                    return res.status(400).json({ message: "Phone number must be exactly 11 digits" });
                }
                const existingPhone = await User.findOne({ phone });
                if (existingPhone && existingPhone._id.toString() !== userId) {
                    return res.status(400).json({ message: "Phone number already in use" });
                }
                updateData.phone = phone;
            }
        }

        if (CNIC) {
            const user = await User.findById(userId);
            if (user.CNIC !== CNIC) {
                if (!/^[0-9]{13}$/.test(CNIC)) {
                    return res.status(400).json({ message: "CNIC must be exactly 13 digits" });
                }
                const existingCNIC = await User.findOne({ CNIC });
                if (existingCNIC && existingCNIC._id.toString() !== userId) {
                    return res.status(400).json({ message: "CNIC already in use" });
                }
                updateData.CNIC = CNIC;
            }
        }

        if (req.file) {
            updateData.image = req.file.path || req.file.secure_url || req.file.url;
        }

        if (role) {
            console.log("Role update attempt blocked. Ignoring role update.");
        }

        Object.assign(updateData, otherFields);

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        }).select("-password");

        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.image) {
            const publicId = user.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`TruckServices-assets/${publicId}`);
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};
exports.logout = async (req, res) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            path: "/",
            expires: new Date(0)
        });

        res.status(200).json({ message: "Logout successful!" });
    } catch (error) {
        console.error("Logout error:", error.message);
        res.status(500).json({ message: "Error logging out", error: error.message });
    }
};
