const Truck = require("../Models/TruckBooking");
const User = require("../Models/userModel");

exports.approveTruck = async (req, res) => {
    try {
        const { truckId } = req.params;

        const truck = await Truck.findById(truckId);
        if (!truck) {
            return res.status(404).json({ message: "Truck not found" });
        }

        // Approve the truck
        truck.status = 'approved';
        truck.approvedBy = req.user._id;
        truck.approvalDate = new Date();
        await truck.save();

        // Approve the driver if not already approved
        const driver = await User.findById(truck.userId);
        if (driver && !driver.isApproved) {
            driver.isApproved = true;
            await driver.save();
        }

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
        const trucks = await Truck.find({ status: 'pending' }).populate('userId');
        res.status(200).json({ success: true, data: trucks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
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