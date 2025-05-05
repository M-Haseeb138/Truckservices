const TruckBooking = require("../Models/TruckBooking");
const Truck = require("../Models/truckRegister");

exports.bookTruck = async (req, res) => {
    try {
        const {
            truckId,
            truckSize,
            loadType,
            fromCity,
            fromArea,
            toCity,
            toArea,
            material,
            weightMt,
            truckType,
            noOfTrucks,
            scheduledDate
        } = req.body;

        // Check if truck exists and is approved
        const truck = await Truck.findOne({ 
            _id: truckId, 
            status: 'approved' 
        });

        if (!truck) {
            return res.status(404).json({ 
                message: "Truck not found or not approved" 
            });
        }

        // Create new booking
        const newBooking = new TruckBooking({
            userId: req.user._id,
            truckId,
            truckSize,
            loadType,
            from: { city: fromCity, area: fromArea },
            to: { city: toCity, area: toArea },
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