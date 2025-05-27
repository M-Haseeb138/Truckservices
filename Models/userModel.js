const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: false,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{11}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    image: {
        type: String,
        required: false
    },
    CNIC: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'driver', 'customer'],
        default: 'customer',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    },
    suspensionReason: {
        type: String,
        required: false
    },
    suspendedAt: {
        type: Date,
        required: false
    },
     currentLocation: {
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        },
        address: { type: String },
        timestamp: { type: Date }
    },
    locationUpdateFrequency: {
        type: Number,

        
        default: 60 // seconds between updates
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);