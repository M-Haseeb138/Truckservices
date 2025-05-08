const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { 
        type: String, 
        required: true, 
        unique: true, 
        validate: {
            validator: (v) => /^[0-9]{11}$/.test(v),
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    image: { type: String },
    password: { type: String, required: true },

    // 🔥 OTP related fields
    otpCode: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    isOtpVerified: { type: Boolean, default: false }, // ✅ Added this field

}, { timestamps: true });

// 🔐 Hash password before saving
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 🔐 Compare password
adminSchema.methods.comparePassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
