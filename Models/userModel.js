const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName : {
        type:String,
        require:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        
    },
    password:{
        type:String,
        required:true
    },
    phone: {
         type: String, 
         required: true },
         image: { 
            type: String,
             required: false
             },
},
{timestamps:true}
);
module.exports = mongoose.model("User",UserSchema);