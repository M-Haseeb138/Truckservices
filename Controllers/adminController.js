const Truck = require("../Models/TruckBooking");
const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const mongoose = require('mongoose');

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
exports.getPendingBookings = async (req, res) => {
    try {
        const bookings = await TruckBooking.find({ status: 'pending' })
            .populate('userId', 'fullName phone')
            .populate('truckId')
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

        const rejectedTruck = await TruckRegistration.findByIdAndUpdate(
            truckId,
            {
                status: 'rejected',
                isAvailable: false, // <-- Important
                rejectionDate: new Date()
            },
            { new: true }
        ).populate('userId');

        if (!rejectedTruck) {
            return res.status(404).json({ success: false, message: "Truck not found" });
        }

        res.status(200).json({ success: true, data: rejectedTruck });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
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
exports.getApprovedDrivers = async (req, res) => {
    try {

        // 1. Find all drivers with assigned bookings
        const assignedDriverIds = await TruckBooking.distinct('assignedDriverId', {
            status: { $in: ['assigned', 'in-progress'] }
        });

        // 2. Find all approved trucks, along with user details, excluding assigned drivers
        const approvedTrucks = await TruckRegistration.find({
            status: 'approved',
            userId: { $nin: assignedDriverIds }
        }).populate('userId', 'fullName phone email CNIC role');

        // 2. Create a map to group trucks by driver
        const driverMap = new Map();

        approvedTrucks.forEach(truck => {
            const driverId = truck.userId._id.toString();

            // Initialize driver if not already added
            if (!driverMap.has(driverId)) {
                driverMap.set(driverId, {
                    _id: truck.userId._id,
                    fullName: truck.userId.fullName,
                    phone: truck.userId.phone,
                    email: truck.userId.email,
                    CNIC: truck.userId.CNIC,
                    role: truck.userId.role,
                    trucks: [] // Will hold all their approved trucks
                });
            }

            // Add current truck details to the driver's truck list
            driverMap.get(driverId).trucks.push({
                _id: truck._id,
                driverDetails: truck.driverDetails,
                ownerDetails: truck.ownerDetails,
                truckDetails: truck.truckDetails,
                idCardFrontImage: truck.idCardFrontImage,
                idCardBackImage: truck.idCardBackImage,
                licenseFrontImage: truck.licenseFrontImage,
                TruckPicture: truck.TruckPicture,
                Truckdocument: truck.truckDetails.Truckdocument,
                registrationDate: truck.createdAt,
                status: truck.status
            });
        });

        // 3. Convert map values to array
        const drivers = Array.from(driverMap.values());

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers
        });

    } catch (error) {
        console.error("Error fetching approved drivers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch approved drivers",
            error: error.message
        });
    }
};
exports.getRegisteredCustomers = async (req, res) => {
    try {
        const customer = await User.find({ role: 'customer' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json(
            {
                success: true,
                count: customer.length,
                customer
            }
        )
    } catch (error) {
        console.error("error Fetching customer", error);
        res.status(500).json({
            sucess: false,
            message: "Failed to fetch customer",
            error: error.message
        });

    }
}
exports.getMatchingDriversForBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // 1. Get the booking details
        const booking = await TruckBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Improved weight normalization
        const normalizeWeight = (weight) => {
            return weight.toLowerCase()
                .replace(/\s+/g, '') // Remove all spaces
                .replace(/upto/gi, '') // Remove "upto"
                .replace(/mt/gi, '') // Remove "mt"
                .trim();
        };

        const bookingWeight = normalizeWeight(booking.weight);

        // 2. Find all drivers with active bookings
        const activeBookings = await TruckBooking.find({
            status: { $in: ['assigned', 'in-progress'] }
        });
        const assignedDriverIds = activeBookings.map(b => b.assignedDriverId?.toString()).filter(id => id);

        // 3. Find all approved trucks that could potentially match
        const allPotentialTrucks = await TruckRegistration.find({
            status: 'approved',
            userId: { $nin: assignedDriverIds }
        }).populate('userId', 'fullName phone email');

        // 4. Filter trucks that match requirements
        const matchingTrucks = allPotentialTrucks.filter(truck => {
            // Check truck type (case-insensitive and partial match)
            const typeMatches = booking.truckTypes.some(bookingType =>
                truck.truckDetails.typeOfTruck.toLowerCase().includes(bookingType.toLowerCase()) ||
                bookingType.toLowerCase().includes(truck.truckDetails.typeOfTruck.toLowerCase())
            );

            // Check weight
            const truckWeight = normalizeWeight(truck.truckDetails.weight);
            const weightMatches = truckWeight === bookingWeight;

            return typeMatches && weightMatches;
        });

        // 5. If no matches found, provide detailed explanation
        if (matchingTrucks.length === 0) {
            const analysis = {
                totalApprovedTrucks: allPotentialTrucks.length,
                matchingTypeWrongWeight: 0,
                matchingWeightWrongType: 0,
                unavailableButMatching: 0
            };

            allPotentialTrucks.forEach(truck => {
                const typeMatches = booking.truckTypes.some(bookingType =>
                    truck.truckDetails.typeOfTruck.toLowerCase().includes(bookingType.toLowerCase()) ||
                    bookingType.toLowerCase().includes(truck.truckDetails.typeOfTruck.toLowerCase())
                );

                const truckWeight = normalizeWeight(truck.truckDetails.weight);
                const weightMatches = truckWeight === bookingWeight;

                if (typeMatches && !weightMatches) analysis.matchingTypeWrongWeight++;
                if (weightMatches && !typeMatches) analysis.matchingWeightWrongType++;
                if (typeMatches && weightMatches && !truck.isAvailable) analysis.unavailableButMatching++;
            });

            return res.status(200).json({
                success: true,
                count: 0,
                bookingRequirements: {
                    truckTypes: booking.truckTypes,
                    weight: booking.weight,
                    materials: booking.materials
                },
                availableDrivers: [],
                matchingAnalysis: analysis
            });
        }

        // 6. Group trucks by driver
        const driverMap = new Map();
        matchingTrucks.forEach(truck => {
            const driverId = truck.userId._id.toString();
            if (!driverMap.has(driverId)) {
                driverMap.set(driverId, {
                    _id: truck.userId._id,
                    fullName: truck.userId.fullName,
                    phone: truck.userId.phone,
                    email: truck.userId.email,
                    trucks: []
                });
            }
            driverMap.get(driverId).trucks.push({
                truckId: truck._id,
                typeOfTruck: truck.truckDetails.typeOfTruck,
                weight: truck.truckDetails.weight,
                vehicleNo: truck.truckDetails.VehicleNo,
                city: truck.truckDetails.Registercity,
                isAvailable: truck.isAvailable
            });
        });

        const availableDrivers = Array.from(driverMap.values());

        res.status(200).json({
            success: true,
            count: availableDrivers.length,
            bookingRequirements: {
                truckTypes: booking.truckTypes,
                weight: booking.weight,
                materials: booking.materials
            },
            availableDrivers
        });

    } catch (error) {
        console.error("Error finding matching drivers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to find matching drivers",
            error: error.message
        });
    }
};
exports.getApprovedTrucks = async (req, res) => {
    try {
        // First get active bookings to build status map
        const activeBookings = await TruckBooking.find({
            status: { $in: ['assigned', 'in-progress'] },
            truckId: { $ne: null }
        }).select('truckId status');

        const truckStatusMap = new Map();
        activeBookings.forEach(booking => {
            if (booking.truckId) {
                truckStatusMap.set(booking.truckId.toString(), booking.status);
            }
        });

        // Get approved trucks with explicit field selection
        const approvedTrucks = await TruckRegistration.find({ status: 'approved' })
            .populate('userId', 'fullName phone email')
            .select('+TruckPicture') // Ensure TruckPicture is included
            .lean();

        // Process trucks with proper image handling
        const trucksWithStatus = approvedTrucks.map(truck => {
            const isAssigned = truckStatusMap.has(truck._id.toString());
            
            return {
                ...truck,
                // Set default image if none exists
                TruckPicture: truck.TruckPicture || 'https://example.com/default-truck.jpg',
                // Remove any old field if present
                ...(truck.profilePicture && { profilePicture: undefined }),
                
                isAvailable: !isAssigned,
                bookingStatus: isAssigned ? 'assigned' : 'available',
                currentAssignment: isAssigned ? {
                    status: truckStatusMap.get(truck._id.toString())
                } : null
            };
        });

        res.status(200).json({
            success: true,
            count: trucksWithStatus.length,
            trucks: trucksWithStatus
        });
    } catch (error) {
        console.error("Error fetching approved trucks:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch approved trucks",
            error: error.message
        });
    }
};

exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({
            role: 'driver',
            status: 'active'
        })
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json({
            sucess: true,
            count: drivers.length,
            drivers
        })

    } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({
            sucess: false,
            message: "Failed to Fetch drivers",
            error: error.message
        })

    }
}
exports.suspendDriver = async (req, res) => {
    try {
        const driverId = req.params.driverId;
        const reason = req.body.reason;

        console.log("Suspending driver:", driverId, "Reason:", reason);

        if (!reason || typeof reason !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Suspension reason is required and must be a string"
            });
        }

        const driver = await User.findByIdAndUpdate(
            driverId,
            {
                status: 'suspended',
                suspensionReason: reason,
                suspendedAt: new Date()
            },
            { new: true }
        ).select('-password');

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver suspended successfully",
            driver
        });

    } catch (error) {
        console.error("Error suspending driver:", error);
        res.status(500).json({
            success: false,
            message: "Failed to suspend driver",
            error: error.message
        });
    }
};
exports.getAllsuspendedDriver = async (req, res) => {
    try {
        const suspendedDrivers = await User.find({
            role: 'driver',
            status: 'suspended'
        }).select('-password');

        if (!suspendedDrivers || suspendedDrivers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No suspended drivers found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Suspended drivers found",
            count: suspendedDrivers.length,
            suspendedDrivers
        });

    } catch (error) {
        console.error("Error fetching suspended drivers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch suspended drivers",
            error: error.message
        });
    }
};
exports.restoresuspendedDriver = async (req, res) => {
    try {
        const driverId = req.params.driverId;

        const driver = await User.findByIdAndUpdate(
            driverId,
            {
                status: 'active',
                $unset: {
                    suspensionReason: 1,
                    suspendedAt: 1
                }
            },
            { new: true }
        ).select('-password');

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver Not Found",
            });
        }

        if (driver.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Driver is not suspended",
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver has been restored successfully",
            data: driver,
        });

    } catch (error) {
        console.error("Error Restoring Driver:", error);
        res.status(500).json({
            success: false,
            message: "Failed to Restore the Driver",
            error: error.message
        });
    }
};
exports.assignDriverToBooking = async (req, res) => {
    try {
        const { bookingId, driverId, truckId } = req.body;

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Verify the user is actually a driver
            const driver = await User.findOne({
                _id: driverId,
                role: 'driver'
            }).session(session);

            if (!driver) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "The specified user is not a registered driver"
                });
            }

            // 2. Find and validate booking
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

            // 3. Find and validate truck belongs to this driver
            const truck = await TruckRegistration.findOne({
                _id: truckId,
                userId: driverId,  // Ensure truck belongs to this driver
                status: 'approved'
            }).session(session);

            if (!truck) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Truck not found, not approved, or doesn't belong to this driver"
                });
            }

            // 4. Check if truck is already assigned
            const existingAssignment = await TruckBooking.findOne({
                truckId: truckId,
                status: { $in: ['assigned', 'in-progress'] }
            }).session(session);

            if (existingAssignment) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "This truck is already assigned to another active booking"
                });
            }

            // 5. Update records
            booking.assignedDriverId = driverId;
            booking.truckId = truckId;
            booking.status = 'assigned';
            booking.assignedAt = new Date();
            booking.approvedBy = req.admin.adminId;
            
            truck.isAvailable = false;
            truck.bookingStatus = 'assigned';

            await Promise.all([
                booking.save({ session }),
                truck.save({ session })
            ]);

            await session.commitTransaction();
            session.endSession();

            // 6. Get fully populated response
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
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await TruckBooking.find({
            status: { $in: ['assigned', 'in-progress', 'completed'] }
        })
        .populate({
            path: 'userId',
            select: 'fullName phone email',
            options: { retainNullValues: false } // This ensures null values are removed
        })
        .populate({
            path: 'assignedDriverId',
            select: 'fullName phone',
            options: { retainNullValues: false }
        })
        .populate('truckId')
        .select('-statusHistory') // Explicitly exclude statusHistory
        .sort({ createdAt: -1 });

        // Transform the data to ensure consistent response structure
        const transformedOrders = orders.map(order => ({
            ...order.toObject(),
            // Ensure these fields are never null in response
            userId: order.userId || undefined,
            assignedDriverId: order.assignedDriverId || undefined
        }));

        res.status(200).json({
            success: true,
            count: transformedOrders.length,
            orders: transformedOrders
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};
exports.getCancelledOrders = async (req, res) => {
    try {
        const orders = await TruckBooking.find({ status: 'cancelled' })
            .populate('userId', 'fullName phone email')
            .populate('assignedDriverId', 'fullName phone')
            .populate('truckId')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error("Error fetching cancelled orders:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch cancelled orders",
            error: error.message
        });
    }
};
exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason is required"
            });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const booking = await TruckBooking.findById(bookingId).session(session)
                .populate('truckId');

            if (!booking) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            // Check if booking can be cancelled
            if (booking.status === 'completed') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Completed bookings cannot be cancelled"
                });
            }

            if (booking.status === 'cancelled') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Booking is already cancelled"
                });
            }

            // Update booking
            booking.status = 'cancelled';
            booking.cancellationReason = reason;
            booking.cancelledAt = new Date();
            booking.cancelledBy = req.admin.adminId;
            
            // Initialize statusHistory if it doesn't exist
            if (!booking.statusHistory) {
                booking.statusHistory = [];
            }
            
            // Add status change record
            booking.statusHistory.push({
                status: 'cancelled',
                changedAt: new Date(),
                changedBy: req.admin.adminId,
                notes: `Cancelled by admin. Reason: ${reason}`
            });

            // Free up truck if assigned
            if (booking.truckId) {
                booking.truckId.isAvailable = true;
                await booking.truckId.save({ session });
            }

            await booking.save({ session });
            await session.commitTransaction();
            session.endSession();

            res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                booking: {
                    _id: booking._id,
                    trackingId: booking.trackingId,
                    status: booking.status,
                    from: booking.from,
                    to: booking.to,
                    cancelledAt: booking.cancelledAt,
                    cancellationReason: booking.cancellationReason
                    // Include other fields you need in the response
                }
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Error in cancelBooking transaction:", error);
            throw error;
        }

    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking",
            error: error.message
        });
    }
};
exports.getTotalorderchart = async (req, res) => {
    try {
        const orderStatuses = await TruckBooking.aggregate([
            {
                $match: {
                    status: { $in: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'] }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    status: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: orderStatuses
        });
    } catch (error) {
        console.error("Error fetching order growth:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order growth", error: error.message });
    }
};
exports.getCustomerGrowth = async (req, res) => {
    try {
        const customerGrowth = await User.aggregate([
            {
                $match: { role: 'customer', createdAt: { $exists: true } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $project: {
                    month: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: {
                                $dateFromParts: {
                                    year: '$_id.year',
                                    month: '$_id.month',
                                    day: 1
                                }
                            }
                        }
                    },
                    count: 1,
                    _id: 0
                }
            }
        ]);

        const totalCustomers = await User.countDocuments({ role: 'customer' });

        res.status(200).json({
            success: true,
            data: {
                customerGrowth,
                totalCustomers
            }
        });
    } catch (error) {
        console.error("Error fetching customer growth:", error);
        res.status(500).json({ success: false, message: "Failed to fetch customer growth", error: error.message });
    }
};


// Get booking timeline
// exports.getBookingTimeline = async (req, res) => {
//     try {
//         const { bookingId } = req.params;

//         const booking = await TruckBooking.findById(bookingId)
//             .populate('statusHistory.changedBy', 'fullName role')
//             .select('statusHistory trackingId');

//         if (!booking) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Booking not found"
//             });
//         }

//         // Authorization check
//         if (req.user.role !== 'admin' && booking.userId.toString() !== req.user.userId) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Unauthorized to view this booking"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             trackingId: booking.trackingId,
//             timeline: booking.statusHistory
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to get booking timeline",
//             error: error.message
//         });
//     }
// };
