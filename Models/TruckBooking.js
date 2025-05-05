const mongoose = require("mongoose");

const truckBookingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    truckId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Truck", 
        required: true 
    },
    truckSize: { 
        type: String, 
        enum: ["Small", "Heavy"], 
        required: true 
    },
    loadType: { 
        type: String, 
        enum: ["Full", "Part"], 
        required: true 
    },
    from: {
        city: { type: String, required: true },
        area: { type: String, required: true }
    },
    to: {
        city: { type: String, required: true },
        area: { type: String, required: true }
    },
    material: { type: String, required: true },
    weightMt: { type: Number, required: true },
    truckType: { type: String, required: true },
    noOfTrucks: { type: Number, required: true },
    scheduledDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model("TruckBooking", truckBookingSchema);