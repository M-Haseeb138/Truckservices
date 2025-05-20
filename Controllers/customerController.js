// In all controllers, use:
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const User = require("../Models/userModel");
const { generateUniqueTrackingId } = require('../utils/trackingGenerator');

exports.bookTruck = async (req, res) => {
    try {
        const {
            from,
            to,
            materials,
            weight,
            truckTypes,
            noOfTrucks,
            scheduledDate
        } = req.body;

        // Get customer details from user model
        const customer = await User.findById(req.user.userId);
        if (!customer) {
            return res.status(404).json({ 
                success: false,
                message: "Customer not found" 
            });
        }

        // Validate date
        if (new Date(scheduledDate) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Scheduled date must be in the future"
            });
        }

        // Generate unique tracking ID
        const trackingId = await generateUniqueTrackingId();

        // Create booking
        const newBooking = new TruckBooking({
            userId: req.user.userId,
            trackingId,
            from,
            to,
            materials,
            weight,
            truckTypes,
            noOfTrucks,
            scheduledDate,
            customerName: customer.fullName,
            customerPhone: customer.phone,
            status: 'pending'
        });

        await newBooking.save();

        res.status(201).json({ 
            success: true, 
            message: "Truck booking request submitted successfully", 
            booking: {
                _id: newBooking._id,
                trackingId: newBooking.trackingId,
                from: newBooking.from,
                to: newBooking.to,
                scheduledDate: newBooking.scheduledDate,
                status: newBooking.status,
                customerName: newBooking.customerName,
                customerPhone: newBooking.customerPhone,
                materials:newBooking.materials,
                weight:newBooking.weight,
                truckTypes:newBooking.truckTypes,
                noOfTrucks:newBooking.noOfTrucks
            }
        });

    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Booking failed",
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
