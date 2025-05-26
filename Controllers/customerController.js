// In all controllers, use:
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const User = require("../Models/userModel");
const { generateUniqueTrackingId } = require('../utils/trackingGenerator');
const LocationService = require('../services/locationService');
const RATE_PER_KM = process.env.RATE_PER_KM || 1.5;
const RateService = require('../services/rateService');
///////


// exports.bookTruck = async (req, res) => {
//     try {
//         const {
//             from,
//             to,
//             materials,
//             weight,
//             truckTypes,
//             noOfTrucks,
//             scheduledDate
//         } = req.body;

//         // Geocode addresses
//         const [fromLocation, toLocation] = await Promise.all([
//             geocodeAddress(from, process.env.GOOGLE_MAPS_API_KEY),
//             geocodeAddress(to, process.env.GOOGLE_MAPS_API_KEY)
//         ]);

//         // Calculate distance
//         const { distance } = await calculateDistance(
//             { lat: fromLocation.lat, lng: fromLocation.lng },
//             { lat: toLocation.lat, lng: toLocation.lng },
//             process.env.GOOGLE_MAPS_API_KEY
//         );

//         // Calculate rate (example: $1 per km)
//         const ratePerKm = 1; // This should be configurable
//         const rate = distance * ratePerKm * noOfTrucks;

//         // Generate unique tracking ID
//         const trackingId = await generateUniqueTrackingId();

//         // Create booking
//         const newBooking = new TruckBooking({
//             userId: req.user.userId,
//             trackingId,
//             from,
//             to,
//             fromCoordinates: {
//                 lat: fromLocation.lat,
//                 lng: fromLocation.lng
//             },
//             toCoordinates: {
//                 lat: toLocation.lat,
//                 lng: toLocation.lng
//             },
//             distance,
//             rate,
//             materials,
//             weight,
//             truckTypes,
//             noOfTrucks,
//             scheduledDate,
//             customerName: customer.fullName,
//             customerPhone: customer.phone,
//             status: 'pending'
//         });

//         await newBooking.save();


//         res.status(201).json({ 
//             success: true, 
//             message: "Truck booking request submitted successfully", 
//             booking: {
//                 _id: newBooking._id,
//                 trackingId: newBooking.trackingId,
//                 from: newBooking.from,
//                 to: newBooking.to,
//                 scheduledDate: newBooking.scheduledDate,
//                 status: newBooking.status,
//                 customerName: newBooking.customerName,
//                 customerPhone: newBooking.customerPhone,
//                 materials:newBooking.materials,
//                 weight:newBooking.weight,
//                 truckTypes:newBooking.truckTypes,
//                 noOfTrucks:newBooking.noOfTrucks,
//                  distance,
//                 rate,
//                 fromCoordinates: newBooking.fromCoordinates,
//                 toCoordinates: newBooking.toCoordinates
//             }
//         });

//     } catch (error) {
//         console.error("Booking error:", error);
//         res.status(500).json({ 
//             success: false, 
//             message: "Booking failed",
//             error: error.message 
//         });
//     }
// };

exports.createBooking = async (req, res) => {
  try {
    console.log("Received booking request:", req.body);

    const { from, to, truckTypes, noOfTrucks, weight, materials, scheduledDate } = req.body;
    const userId = req.user?.userId;

    // Input validation
    if (!from || !to || !Array.isArray(truckTypes) || truckTypes.length === 0 || !noOfTrucks || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields: from, to, truckTypes[], noOfTrucks, scheduledDate"
      });
    }

    // Get customer details
    const customer = await User.findById(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Geocode locations
    const [startLocation, endLocation] = await Promise.all([
      LocationService.geocodeAddress(from),
      LocationService.geocodeAddress(to)
    ]);

    if (!startLocation?.coordinates || !endLocation?.coordinates) {
      return res.status(400).json({ success: false, message: "Invalid addresses provided" });
    }

    // Calculate route
    const { distance, duration } = await LocationService.calculateRoute(
      startLocation.coordinates,
      endLocation.coordinates
    );

    if (!distance || isNaN(distance)) {
      return res.status(500).json({ success: false, message: "Failed to calculate distance" });
    }

    // Calculate rate
    const rateDetails = await RateService.calculateSimpleRate(
      truckTypes[0],
      distance,
      noOfTrucks
    );

    if (!rateDetails || !rateDetails.totalRate) {
      return res.status(500).json({ success: false, message: "Failed to calculate rate" });
    }

    // Create booking
    const booking = new TruckBooking({
      userId,
      from,
      to,
      truckTypes,
      noOfTrucks,
      weight,
      materials,
      scheduledDate,
      trackingId: await generateUniqueTrackingId(),
      customerName: customer.fullName,
      customerPhone: customer.phone,
      route: {
        start: startLocation,
        end: endLocation,
        distance,
        estimatedDuration: duration
      },
      rate: rateDetails.totalRate,
      rateDetails
    });

    await booking.save();

    const populatedBooking = await TruckBooking.findById(booking._id)
      .populate('userId', 'fullName phone email')
      .lean();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        ...populatedBooking,
        trackingId: booking.trackingId,
        rateDetails
      }
    });

  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.getMyBookings = async (req, res) => {
    try {
        // Fetch bookings with populated driver and truck details
        const bookings = await TruckBooking.find({ userId: req.user.userId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .populate({
                path: 'assignedDriverId',
                select: 'fullName phone email',
                options: { retainNullValues: true } // Keep null if not assigned
            })
            .populate({
                path: 'truckId',
                select: 'truckDetails.VehicleNo truckDetails.typeOfTruck status',
                options: { retainNullValues: true } // Keep null if not assigned
            });

        // Handle empty results gracefully
        if (!bookings || bookings.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: "No bookings found for this user",
                count: 0,
                data: [] 
            });
        }

        // Format response with additional metadata
        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            count: bookings.length,
            data: bookings.map(booking => ({
                _id: booking._id,
                trackingId: booking.trackingId,
                from: booking.from,
                to: booking.to,
                scheduledDate: booking.scheduledDate,
                status: booking.status,
                customerName: booking.customerName,
                customerPhone: booking.customerPhone,
                materials: booking.materials,
                weight: booking.weight,
                truckTypes: booking.truckTypes,
                noOfTrucks: booking.noOfTrucks,
                assignedDriver: booking.assignedDriverId || null,
                assignedTruck: booking.truckId || null,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt
            }))
        });

    } catch (error) {
        // Enhanced error logging with user context
        console.error(`[${new Date().toISOString()}] Error fetching bookings for user ${req.user.userId}:`, {
            error: error.message,
            stack: error.stack
        });

        // Consistent error response format
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching bookings",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
};
exports.getBookingByTrackingId = async (req, res) => {
    try {
        const { trackingId } = req.params;

        // console.log("Booking request for tracking ID:", trackingId);
        // console.log("Logged-in user ID:", req.user.userId);

        if (!trackingId || trackingId.length !== 6) {
            return res.status(400).json({
                success: false,
                message: "Invalid tracking ID format"
            });
        }

        const booking = await TruckBooking.findOne({ trackingId })
            .populate('userId', 'fullName phone email')
            .populate('assignedDriverId', 'fullName phone email')
            .populate('truckId', 'truckDetails.VehicleNo truckDetails.typeOfTruck');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // console.log("Booking's user ID:", booking.userId._id.toString());
        // console.log("Booking user info:", booking.userId);

        // Authorization check
     if (req.user.role !== 'admin' && booking.userId._id.toString() !== req.user.userId.toString()) {
    return res.status(403).json({
        success: false,
        message: "Unauthorized to view this booking"
    });
}

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.error(`Error fetching booking ${req.params.trackingId}:`, error);
        res.status(500).json({
            success: false,
            message: "Failed to get booking",
            error: error.message
        });
    }
};
exports.cancelPendingBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await TruckBooking.findOne({
            _id: bookingId,
            userId: req.user.userId,
            status: 'pending'
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Pending booking not found or already processed"
            });
        }

        booking.status = 'cancelled';
        booking.cancellationReason = "Cancelled by customer";
        booking.cancelledAt = new Date();
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking",
            error: error.message
        });
    }
};
exports.getBookingLocation = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await TruckBooking.findOne({
            _id: bookingId,
            userId: req.user.userId
        }).select('fromCoordinates toCoordinates status trackingId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                from: booking.fromCoordinates,
                to: booking.toCoordinates,
                status: booking.status,
                trackingId: booking.trackingId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get booking location",
            error: error.message
        });
    }
}
exports.getRateEstimate = async (req, res) => {
  try {
    const { from, to, truckType, noOfTrucks } = req.body;

    // Validate input
    if (!from || !to || !truckType) {
      return res.status(400).json({
        success: false,
        message: "From, to, and truckType are required fields"
      });
    }

    console.log('Starting rate calculation for:', { from, to, truckType, noOfTrucks });

    // Geocode addresses
    const [startLocation, endLocation] = await Promise.all([
      LocationService.geocodeAddress(from),
      LocationService.geocodeAddress(to)
    ]);

    console.log('Geocoding results:', { startLocation, endLocation });

    // Calculate route
    const routeInfo = await LocationService.calculateRoute(
      startLocation.coordinates,
      endLocation.coordinates
    );

    console.log('Route calculation results:', routeInfo);

    // Calculate rate
    const rateDetails = await RateService.calculateSimpleRate(
      truckType,
      routeInfo.distance,
      parseInt(noOfTrucks) || 1
    );

    res.status(200).json({
      success: true,
      data: {
        from,
        to,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        ...rateDetails
      }
    });
  } catch (error) {
    console.error('Rate estimate error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPlaceSuggestions = async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input || input.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Input must be at least 3 characters long"
      });
    }

    const suggestions = await LocationService.getPlaceSuggestions(input);
    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get place suggestions",
      error: error.message
    });
  }
};

exports.calculateCompleteRate = async (req, res) => {
  try {
    const { from, to, truckType, noOfTrucks } = req.body;

    if (!from || !to || !truckType) {
      return res.status(400).json({
        success: false,
        message: "From, to, and truckType are required"
      });
    }

    const rateDetails = await RateService.calculateCompleteRate(
      from,
      to,
      truckType,
      parseInt(noOfTrucks) || 1
    );

    res.status(200).json({
      success: true,
      data: rateDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate rate",
      error: error.message
    });
  }
};

