const Truck = require("../Models/TruckBooking");
const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");


exports.approveBooking = async (req, res) => {
    try {
        const { bookingId, truckId } = req.params;

        const booking = await TruckBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Verify truck exists and matches booking requirements
        const truck = await TruckRegistration.findOne({
            _id: truckId,
            status: 'approved',
            isAvailable: true,
            'truckDetails.typeOfTruck': { $in: booking.truckTypes },
            'truckDetails.weight': booking.weight
        });

        if (!truck) {
            return res.status(400).json({
                success: false,
                message: "Selected truck doesn't meet requirements or is unavailable"
            });
        }

        // Update records
        await TruckRegistration.findByIdAndUpdate(truckId, { isAvailable: false });
        
        booking.truckId = truckId;
        booking.status = 'approved';
        booking.approvedBy = req.admin.adminId;
        booking.approvalDate = new Date();
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking approved and truck assigned",
            booking
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Server Error", 
            error: error.message 
        });
    }
};
exports.assignDriver = async (req, res) => {
    try {
        const { bookingId, driverId } = req.body;

        // Validate booking exists and is approved
        const booking = await TruckBooking.findOne({
            _id: bookingId,
            status: 'approved'
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Approved booking not found"
            });
        }

        // Verify driver owns the assigned truck
        const validTruck = await TruckRegistration.findOne({
            _id: booking.truckId,
            userId: driverId
        });
        if (!validTruck) {
            return res.status(400).json({
                success: false,
                message: "Driver doesn't own the assigned truck"
            });
        }

        // Update booking
        booking.assignedDriverId = driverId;
        booking.status = 'assigned';
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Driver assigned successfully",
            booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to assign driver",
            error: error.message
        });
    }
};
exports.approveTruck = async (req, res) => {
    try {
        const { truckId } = req.params;

        const truck = await TruckRegistration.findById(truckId);
        if (!truck) {
            return res.status(404).json({ message: "Truck not found" });
        }

        // Approve the truck
        truck.status = 'approved';
         truck.approvedBy = req.admin.adminId;
        truck.approvalDate = new Date();
        await truck.save();


        res.status(200).json({
            message: "Truck approved successfully",
            truck
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
exports.getPendingTrucks = async (req, res) => {
    try {
        const trucks = await TruckRegistration.find({ status: 'pending' }).populate('userId');
        res.status(200).json({ success: true, data: trucks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
exports.getAvailableTrucks = async (req, res) => {
    try {
        const { truckType, weight } = req.query;

        const filter = {
            status: 'approved',
            isAvailable: true
        };

        if (truckType) {
            filter['truckDetails.typeOfTruck'] = truckType;
        }

        if (weight) {
            filter['truckDetails.weight'] = weight;
        }

        const trucks = await TruckRegistration.find(filter)
            .populate('userId', 'fullName phone');

        res.status(200).json({
            success: true,
            data: trucks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch available trucks",
            error: error.message
        });
    }
};
exports.getAvailableTrucksForBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // 1. Get booking requirements
        const booking = await TruckBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ 
                success: false,
                message: "Booking not found" 
            });
        }

        // 2. Find matching available trucks
        const trucks = await TruckRegistration.find({
            status: 'approved',
            isAvailable: true,
            'truckDetails.typeOfTruck': { $in: booking.truckTypes },
            'truckDetails.weight': booking.weight
        }).populate('userId', 'fullName phone');

        res.status(200).json({ 
            success: true, 
            data: trucks 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to get available trucks",
            error: error.message 
        });
    }
};
exports.getPendingBookings = async (req, res) => {
    try {
        const bookings = await TruckBooking.find({ status: 'pending' })
            .populate('userId', 'fullName phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get pending bookings",
            error: error.message
        });
    }
};
exports.rejectTruck = async (req, res) => {
    try {
        const { truckId } = req.params;

        const truck = await TruckRegistration.findById(truckId);
        if (!truck) {
            return res.status(404).json({ success: false, message: "Truck not found" });
        }

        truck.status = 'rejected';
        truck.rejectedBy = req.admin.adminId;
        truck.rejectionDate = new Date();
        await truck.save();

        res.status(200).json({
            success: true,
            message: "Truck rejected successfully",
            truck
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};
exports.getRejectedTrucks = async (req, res) => {
    try {
        const trucks = await TruckRegistration.find({ status: 'rejected' }).populate('userId');
        res.status(200).json({ success: true, data: trucks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


/////////////////////////
exports.getAvailableDrivers = async (req, res) => {
    try {
        // Find drivers who don't have active assignments
        const drivers = await User.find({
            role: 'driver',
            isApproved: true
        }).select('fullName phone');

        res.status(200).json({
            success: true,
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get available drivers",
            error: error.message
        });
    }
};
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' }).select('-password');
        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = {
            pending: await TruckBooking.countDocuments({ status: 'pending' }),
            assigned: await TruckBooking.countDocuments({ status: 'assigned' }),
            inProgress: await TruckBooking.countDocuments({ status: 'in-progress' }),
            completed: await TruckBooking.countDocuments({ status: 'completed' }),
            drivers: await User.countDocuments({ role: 'driver', isApproved: true })
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get dashboard stats",
            error: error.message
        });
    }
};
// old apis
exports.getPendingDrivers = async (req, res) => {
    try {
        const drivers = await User.find({
            role: 'driver',
            isApproved: false
        }).select('-password');
        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
