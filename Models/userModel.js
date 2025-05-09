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
    CNIC:{
        type:String,
        required:true,
    },
    role: {
        type: String,
        enum: ['admin', 'driver', 'customer'],
        default: 'customer',
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);