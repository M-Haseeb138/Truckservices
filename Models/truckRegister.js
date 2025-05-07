const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema({
    ownerDetails: {
        truckOwnerName: { type: String, required: true },
        mobileNo: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        province: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true }
    },
    driverDetails: {
        truckDriverName: { type: String, required: true },
        mobileNo: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        province: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true },
        city: { type: String, required: true },
        lisenceNo:{type:String,required:true}
    },
    idCardFrontImage: { type: String, required: true },
    idCardBackImage: { type: String, required: true },
    licenseFrontImage: { type: String, required: true },
    profilePicture: { type: String, required: true },
    truckDetails: {
        typeOfTruck: { type: String, required: true },
        weight: { type: String, required: true },
        Registercity: { type: String, required: true },
        VehicleNo: { type: String, required: true },
        Truckdocument:{type:String,require:true}
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    approvedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },
    isAvailable: {
        type: Boolean,
        default: true
      },
    approvalDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TruckRegistration ', truckSchema);