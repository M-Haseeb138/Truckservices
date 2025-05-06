const TruckBooking = require("../Models/TruckBooking");
const Truck = require("../Models/truckRegister");

exports.bookTruck = async (req, res) => {
    try {
        const {
            truckId,
            truckSize,
            loadType,
            from,
            to,
            material,
            weightMt,
            truckType,
            noOfTrucks,
            scheduledDate
        } = req.body;

        // Validate if truck exists and is approved
        const truck = await Truck.findOne({ 
            _id: truckId,
            status: 'approved' 
        });

        if (!truck) {
            return res.status(404).json({ 
                success: false,
                message: "This truck is not available for booking (not approved by admin)"
            });
        }

        const bookingDate = new Date(scheduledDate);
        if (bookingDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Scheduled date must be in the future"
            });
        }

        // Create booking
        const newBooking = new TruckBooking({
            userId: req.user.userId,  // Notice: req.user.userId (not _id) based on your token
            truckId,
            truckSize,
            loadType,
            from,
            to,
            material,
            weightMt,
            truckType,
            noOfTrucks,
            scheduledDate,
            status: 'pending'
        });

        await newBooking.save();

        res.status(201).json({ 
            success: true, 
            message: "Truck booked successfully", 
            booking: newBooking 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            error: error.message 
        });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await TruckBooking.find({ userId: req.user._id })
            .populate('truckId')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Server Error", 
            error: error.message 
        });
    }
};