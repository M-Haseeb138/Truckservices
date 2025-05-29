// In all controllers, use:
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const User = require("../Models/userModel");
const { generateUniqueTrackingId } = require('../utils/trackingGenerator');
const LocationService = require('../services/locationService');
const RATE_PER_KM = process.env.RATE_PER_KM || 1.5;
const RateService = require('../services/rateService');

exports.createBooking = async (req, res) => {
  try {
    console.log("Received booking request:", req.body);

    const { fromAddress, toAddress, truckTypes, noOfTrucks, weight, materials, scheduledDate } = req.body;
    const userId = req.user?.userId;

    // Input validation
    if (
      !fromAddress?.formattedAddress || !fromAddress?.coordinates?.lat || !fromAddress?.coordinates?.lng ||
      !toAddress?.formattedAddress || !toAddress?.coordinates?.lat || !toAddress?.coordinates?.lng ||
      !Array.isArray(truckTypes) || truckTypes.length === 0 ||
      !noOfTrucks || !scheduledDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields"
      });
    }

    // Get customer details
    const customer = await User.findById(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Calculate distance & duration
    const { distance, duration } = await LocationService.calculateRoute(
      fromAddress.coordinates,
      toAddress.coordinates
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
      fromAddress,
      toAddress,
      truckTypes,
      noOfTrucks,
      weight,
      materials,
      scheduledDate,
      trackingId: await generateUniqueTrackingId(),
      customerName: customer.fullName,
      customerPhone: customer.phone,
     route: {
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

