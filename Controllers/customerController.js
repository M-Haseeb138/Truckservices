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
exports.getMyBookings = async(req,res)=>{

    try {
        const bookings = await TruckBooking.find({userId:req.user.userId})
        .sort({createdAt : -1})
        .populate('assignedDriverId', 'fullName phone');
        res.status(200).json({
            sucess:true,
            data : bookings
        });
    } catch (error) {
        res.status(500).json({
            sucess:false,
            message:"Failed to get bookings",
            error:error.message
        })
    }
}
// Get booking by tracking ID (for customers and admins)
exports.getBookingByTrackingId = async (req, res) => {
    try {
        const { trackingId } = req.params;

        const booking = await TruckBooking.findOne({ trackingId })
            .populate('userId', 'fullName phone')
            .populate('assignedDriverId', 'fullName phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Authorization check
        if (req.user.role !== 'admin' && booking.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to view this booking"
            });
        }

        res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
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
