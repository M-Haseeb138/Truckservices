const mongoose = require("mongoose");

const truckBookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  assignedDriverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  from: { 
    type: String, 
    required: true 
  },
  to: { 
    type: String, 
    required: true 
  },
  materials: [{
    type: String,
    enum: [
      "Auto Parts",
      "Bardana jute or plastic",
      "Building Materials",
      "Cement",
      "Chemicals",
      "Coal And Ash",
      "Container",
      "Cotton seed",
      "Electronics Consumer Durables",
      "Fertilizers",
      "Fruits And Vegetables",
      "Furniture And Wood Products",
      "House Hold Goods",
      "Industrial Equipments",
      "Iron sheets or bars or scraps",
      "Liquids in drums",
      "Liquids/Oil",
      "Machinery new or old",
      "Medicals",
      "Metals",
      "Mill Jute Oil",
      "Others",
      "Packed Food",
      "Plastic Pipes or other products",
      "powder bags",
      "Printed books or Paper rolls",
      "Refrigerated Goods",
      "Rice or wheat or Agriculture Products",
      "Scrap",
      "Spices",
      "Textiles",
      "Tyres And Rubber Products",
      "Vehicles or car"
    ],
    required: true
  }],
  weight: {
    type: String,
    enum: [
      "Above 30 MT",
      "Do Not Know",
      "Upto 12 MT",
      "Upto 15 MT",
      "Upto 20 MT",
      "Upto 25 MT",
      "Upto 28 MT",
      "Upto 5 MT",
      "Upto 7 MT",
      "Upto 9 MT"
    ],
    required: true
  },
  truckTypes: [{
    type: String,
    enum: [
      "Shahzor-9Ft Open",
      "Mazda- 12/14 Ft",
      "Mazda-16/17/18 Ft Open",
      "Mazda-19/20Ft Open",
      "Mazda Flat Bed-25 x 8 (LHR only)",
      "Mazda-14/16(Containerized)",
      "Mazda-17Ft (Containerized)",
      "Flat Bed-20Ft (6 Wheeler)",
      "Flat Bed-40Ft (14 Wheeler)",
      "Boom Truck-16Ft",
      "20Ft Container-Standard",
      "40Ft Container- Standard",
      "22 Wheeler (Half Body)",
      "Mazda - 12Ton",
      "10 Wheeler Open Body",
      "Flat Bed-40Ft (18 Wheeler)",
      "Flat Bed-40Ft (22 Wheeler)",
      "Low Bed- 25Ft (10 wheeler)",
      "Single Hino (6 Wheeler) [6 Natti]",
      "Mazda-20Ft (Containerized)",
      "Mazda-22Ft (Containerized)",
      "40Ft HC Container",
      "Low Bed- 40Ft (22 wheeler)",
      "Mazda - 32Ft Container (Punjab&KPK)",
      "Shahzor- 9ft Container",
      "Ravi Pick Up (Open)",
      "Dumper - 10 Wheeler",
      "40Ft single Trailer",
      "40Ft - Double 20 Trailer",
      "20Ft Single Truck",
      "Low Bed- 30Ft (10 wheeler)",
      "17Ft Mazda Container",
      "24Ft Mazda Container",
      "Mazda 16/18Ft Tow Truck",
      "Mazda 26Ft Container",
      "Crane -25 Ton",
      "50ft HC Container",
      "45ft HC Container",
      "20Ft Reefer Container"
    ],
    required: true
  }],
  noOfTrucks: { 
    type: Number, 
    required: true 
  },
  scheduledDate: { 
    type: Date, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  customerName: { 
    type: String 
  },
  customerPhone: { 
    type: String 
  },
    trackingId: {
        type: String,
        unique: true,
        required: true
    },
    truckId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "TruckRegistration"
},
  assignedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
route: {
    start: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    end: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    distance: Number, // in km
    estimatedDuration: String
  },
  currentLocation: {
    coordinates: {
      lat: Number,
      lng: Number
    },
    address: String,
    timestamp: Date
  },
  locationHistory: [{
    coordinates: {
      lat: Number,
      lng: Number
    },
    address: String,
    timestamp: { type: Date, default: Date.now }
  }],
  rate: {
    type: Number,
    required: true
  },
  rateDetails: {
    baseRatePerKm: Number,
    minimumCharge: Number,
    calculatedDistance: Number,
    noOfTrucks: Number,
    currency: {
      type: String,
      default: "PKR"
    }
  },
  locationUpdateFrequency: { 
  type: Number, 
  default: 60 // seconds between updates
}
},

 { timestamps: true });

module.exports = mongoose.model("TruckBooking", truckBookingSchema);

