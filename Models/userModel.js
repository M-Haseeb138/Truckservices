const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: false,  
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: Number, 
        required: true,
        unique: true, 
        validate: {
            validator: function(v) {
                return /^\d{11}$/.test(v); 
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    image: {
        type: String,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
