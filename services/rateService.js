const RateConfig = require('../Models/RateConfig');
const LocationService = require('./locationService');

class RateService {
  static async getRateConfig(truckType) {
    return await RateConfig.findOne({ truckType, active: true });
  }

  static async calculateSimpleRate(truckType, distance, noOfTrucks = 1) {
    const rateConfig = await this.getRateConfig(truckType);
    
    if (!rateConfig) {
      throw new Error(`No rate configuration found for truck type: ${truckType}`);
    }

    // Calculate base rate
    let baseRate = distance * rateConfig.baseRatePerKm * noOfTrucks;
    
    // Apply minimum charge
    if (baseRate < rateConfig.minimumCharge * noOfTrucks) {
      baseRate = rateConfig.minimumCharge * noOfTrucks;
    }

    return {
      totalRate: baseRate,
      baseRatePerKm: rateConfig.baseRatePerKm,
      minimumCharge: rateConfig.minimumCharge,
      calculatedDistance: distance,
      noOfTrucks,
      currency: "PKR"
    };
  }

  static async calculateCompleteRate(from, to, truckType, noOfTrucks = 1) {
    try {
      // Step 1: Geocode addresses
      const [startLocation, endLocation] = await Promise.all([
        LocationService.geocodeAddress(from),
        LocationService.geocodeAddress(to)
      ]);

      // Step 2: Calculate distance
      const { distance, duration, distanceText } = await LocationService.calculateRoute(
        startLocation.coordinates,
        endLocation.coordinates
      );

      // Step 3: Get rate configuration
      const rateConfig = await this.getRateConfig(truckType);
      if (!rateConfig) {
        throw new Error(`No rate configuration found for truck type: ${truckType}`);
      }

      // Step 4: Calculate rates
      let baseRate = distance * rateConfig.baseRatePerKm * noOfTrucks;
      if (baseRate < rateConfig.minimumCharge * noOfTrucks) {
        baseRate = rateConfig.minimumCharge * noOfTrucks;
      }

      return {
        from: startLocation.address,
        to: endLocation.address,
        distance: distance,
        distanceText: distanceText,
        duration: duration,
        truckType: truckType,
        noOfTrucks: noOfTrucks,
        baseRatePerKm: rateConfig.baseRatePerKm,
        minimumCharge: rateConfig.minimumCharge,
        totalRate: baseRate,
        currency: "PKR",
        coordinates: {
          start: startLocation.coordinates,
          end: endLocation.coordinates
        }
      };
    } catch (error) {
      console.error('Rate calculation error:', error);
      throw error;
    }
  }

  static async initializeDefaultRates() {
    const defaultRates = [
      { truckType: "Shahzor-9Ft Open", baseRatePerKm: 80, minimumCharge: 2000 },
      { truckType: "Mazda- 12/14 Ft", baseRatePerKm: 100, minimumCharge: 2500 },
      { truckType: "Mazda-16/17/18 Ft Open", baseRatePerKm: 110, minimumCharge: 2700 },
      { truckType: "Mazda-19/20Ft Open", baseRatePerKm: 120, minimumCharge: 3000 },
      { truckType: "Mazda Flat Bed-25 x 8 (LHR only)", baseRatePerKm: 140, minimumCharge: 3500 },
      { truckType: "Mazda-14/16(Containerized)", baseRatePerKm: 115, minimumCharge: 2800 },
      { truckType: "Mazda-17Ft (Containerized)", baseRatePerKm: 120, minimumCharge: 2900 },
      { truckType: "Flat Bed-20Ft (6 Wheeler)", baseRatePerKm: 150, minimumCharge: 4000 },
      { truckType: "Flat Bed-40Ft (14 Wheeler)", baseRatePerKm: 180, minimumCharge: 5000 },
      { truckType: "Boom Truck-16Ft", baseRatePerKm: 160, minimumCharge: 4500 },
      { truckType: "20Ft Container-Standard", baseRatePerKm: 140, minimumCharge: 3600 },
      { truckType: "40Ft Container- Standard", baseRatePerKm: 190, minimumCharge: 5200 },
      { truckType: "22 Wheeler (Half Body)", baseRatePerKm: 210, minimumCharge: 5500 },
      { truckType: "Mazda - 12Ton", baseRatePerKm: 130, minimumCharge: 3200 },
      { truckType: "10 Wheeler Open Body", baseRatePerKm: 170, minimumCharge: 4800 },
      { truckType: "Flat Bed-40Ft (18 Wheeler)", baseRatePerKm: 200, minimumCharge: 5300 },
      { truckType: "Flat Bed-40Ft (22 Wheeler)", baseRatePerKm: 220, minimumCharge: 5800 },
      { truckType: "Low Bed- 25Ft (10 wheeler)", baseRatePerKm: 180, minimumCharge: 4700 },
      { truckType: "Single Hino (6 Wheeler) [6 Natti]", baseRatePerKm: 150, minimumCharge: 4200 },
      { truckType: "Mazda-20Ft (Containerized)", baseRatePerKm: 145, minimumCharge: 3900 },
      { truckType: "Mazda-22Ft (Containerized)", baseRatePerKm: 150, minimumCharge: 4100 },
      { truckType: "40Ft HC Container", baseRatePerKm: 195, minimumCharge: 5400 },
      { truckType: "Low Bed- 40Ft (22 wheeler)", baseRatePerKm: 230, minimumCharge: 6000 },
      { truckType: "Mazda - 32Ft Container (Punjab&KPK)", baseRatePerKm: 200, minimumCharge: 5600 },
      { truckType: "Shahzor- 9ft Container", baseRatePerKm: 85, minimumCharge: 2100 },
      { truckType: "Ravi Pick Up (Open)", baseRatePerKm: 70, minimumCharge: 1800 },
      { truckType: "Dumper - 10 Wheeler", baseRatePerKm: 190, minimumCharge: 5100 },
      { truckType: "40Ft single Trailer", baseRatePerKm: 200, minimumCharge: 5400 },
      { truckType: "40Ft - Double 20 Trailer", baseRatePerKm: 210, minimumCharge: 5600 },
      { truckType: "20Ft Single Truck", baseRatePerKm: 135, minimumCharge: 3700 },
      { truckType: "Low Bed- 30Ft (10 wheeler)", baseRatePerKm: 185, minimumCharge: 4900 },
      { truckType: "17Ft Mazda Container", baseRatePerKm: 115, minimumCharge: 3000 },
      { truckType: "24Ft Mazda Container", baseRatePerKm: 145, minimumCharge: 4100 },
      { truckType: "Mazda 16/18Ft Tow Truck", baseRatePerKm: 160, minimumCharge: 4400 },
      { truckType: "Mazda 26Ft Container", baseRatePerKm: 165, minimumCharge: 4500 },
      { truckType: "Crane -25 Ton", baseRatePerKm: 250, minimumCharge: 8000 },
      { truckType: "50ft HC Container", baseRatePerKm: 240, minimumCharge: 7000 },
      { truckType: "45ft HC Container", baseRatePerKm: 230, minimumCharge: 6800 },
      { truckType: "20Ft Reefer Container", baseRatePerKm: 160, minimumCharge: 4200 }
    ];

    await RateConfig.deleteMany({});
    await RateConfig.insertMany(defaultRates);
  }
}

module.exports = RateService;