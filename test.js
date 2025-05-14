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