exports.getMyBookingsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        // Validate status
        const validStatuses = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const bookings = await TruckBooking.find({ 
            userId: req.user.userId,
            status: status 
        })
        .sort({ createdAt: -1 })
        .populate('assignedDriverId', 'fullName phone email')
        .populate('truckId', 'truckDetails.VehicleNo truckDetails.typeOfTruck');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error(`Error fetching ${status} bookings:`, error);
        res.status(500).json({
            success: false,
            message: "Failed to get bookings",
            error: error.message
        });
    }
};

exports.getMyTrucksByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const trucks = await TruckRegistration.find({ 
            userId: req.user.userId,
            status: status 
        })
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: trucks.length,
            data: trucks
        });
    } catch (error) {
        console.error(`Error fetching ${status} trucks:`, error);
        res.status(500).json({
            success: false,
            message: "Failed to get trucks",
            error: error.message
        });
    }
};