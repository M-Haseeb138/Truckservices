exports.assignDriverToBooking = async (req, res) => {
    try {
        const { bookingId, driverId, truckId } = req.body;

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find and validate booking
            const booking = await TruckBooking.findById(bookingId)
                .session(session)
                .populate('userId', 'fullName phone');

            if (!booking) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            // Find and validate truck and driver
            const truck = await TruckRegistration.findOne({
                _id: truckId,
                userId: driverId,
                status: 'approved'
            }).session(session);

            if (!truck) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Truck not found or not approved"
                });
            }

            // Update booking
            booking.assignedDriverId = driverId;
            booking.truckId = truckId;
            booking.status = 'assigned';
            booking.assignedAt = new Date();
            booking.approvedBy = req.admin.adminId;
            
            // Update truck status
            truck.isAvailable = false;
            truck.bookingStatus = 'assigned';

            await Promise.all([
                booking.save({ session }),
                truck.save({ session })
            ]);

            await session.commitTransaction();
            session.endSession();

            // Get fully populated booking for response
            const updatedBooking = await TruckBooking.findById(bookingId)
                .populate('userId', 'fullName phone email')
                .populate('assignedDriverId', 'fullName phone')
                .populate('truckId');

            res.status(200).json({
                success: true,
                message: "Driver and truck assigned successfully",
                booking: updatedBooking
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.error("Error assigning driver:", error);
        res.status(500).json({
            success: false,
            message: "Failed to assign driver",
            error: error.message
        });
    }
};
