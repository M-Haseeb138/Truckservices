const mongoose = require('mongoose');

const rateConfigSchema = new mongoose.Schema({
  truckType: {
    type: String,
    required: true,
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
    unique: true
  },
  baseRatePerKm: {
    type: Number,
    required: true,
    min: 0
  },
  minimumCharge: {
    type: Number,
    required: true,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RateConfig', rateConfigSchema);