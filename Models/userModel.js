const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: false 
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true 
    },
    image: {
        type: String,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
