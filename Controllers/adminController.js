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
                profilePicture: truck.profilePicture,
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

// exports.assignDriverToBooking = async (req, res) => {
//     try {
//         const { bookingId, driverId, truckId } = req.body;

//         // 1. Validate all required fields
//         if (!bookingId || !driverId || !truckId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Booking ID, Driver ID and Truck ID are required"
//             });
//         }

//         // 2. Find and validate the booking
//         const booking = await TruckBooking.findById(bookingId);
//         if (!booking) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Booking not found"
//             });
//         }
//         if (booking.status !== 'pending') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Only pending bookings can be assigned"
//             });
//         }

//         // 3. Find and validate the truck
//         const truck = await TruckRegistration.findOne({
//             _id: truckId,
//             userId: driverId,
//             status: 'approved',
//             isAvailable: true
//         });

//         if (!truck) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Truck not found or not available"
//             });
//         }

//         // 4. Normalize weight strings for comparison
//         const normalizeWeight = (weight) => {
//             return weight.replace(/\s+/g, ' ').trim().toLowerCase();
//         };

//         // Check if truck matches booking requirements
//         const bookingWeight = normalizeWeight(booking.weight);
//         const truckWeight = normalizeWeight(truck.truckDetails.weight);

//         if (!booking.truckTypes.includes(truck.truckDetails.typeOfTruck) ||
//             bookingWeight !== truckWeight) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Selected truck doesn't match booking requirements",
//                 details: {
//                     bookingTypes: booking.truckTypes,
//                     truckType: truck.truckDetails.typeOfTruck,
//                     bookingWeight: booking.weight,
//                     truckWeight: truck.truckDetails.weight,
//                     normalizedBookingWeight: bookingWeight,
//                     normalizedTruckWeight: truckWeight
//                 }
//             });
//         }

//         // 5. Update the booking and truck status
//         booking.assignedDriverId = driverId;
//         booking.truckId = truckId;
//         booking.status = 'assigned';
//         booking.approvedBy = req.admin.adminId;
//         booking.approvalDate = new Date();

//         truck.isAvailable = false;
//         truck.bookingStatus = 'assigned';

//         // 6. Save changes in a transaction
//         await Promise.all([
//             booking.save(),
//             truck.save()
//         ]);

//         res.status(200).json({
//             success: true,
//             message: "Driver assigned successfully",
//             booking: {
//                 _id: booking._id,
//                 trackingId: booking.trackingId,
//                 assignedDriverId: booking.assignedDriverId,
//                 truckId: booking.truckId,
//                 status: booking.status,
//                 from: booking.from,
//                 to: booking.to,
//                 scheduledDate: booking.scheduledDate
//             }
//         });

//     } catch (error) {
//         console.error("Error assigning driver:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to assign driver",
//             error: error.message
//         });
//     }
// };

exports.assignDriverToBooking = async (req, res) => {
    try {
        const { bookingId, driverId, truckId } = req.body;

        // Validate input
        if (!bookingId || !driverId || !truckId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID, Driver ID and Truck ID are required"
            });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find and validate booking
            const booking = await TruckBooking.findById(bookingId).session(session);
            if (!booking) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            if (booking.status !== 'pending') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Only pending bookings can be assigned"
                });
            }

            // Find and validate truck
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

            // Check if truck is already assigned to another active booking
            const existingAssignment = await TruckBooking.findOne({
                truckId: truckId,
                status: { $in: ['assigned', 'in-progress'] }
            }).session(session);

            if (existingAssignment) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Truck is already assigned to another active booking"
                });
            }

            // Update booking
            booking.truckId = truckId;
            booking.assignedDriverId = driverId;
            booking.status = 'assigned';
            booking.approvedBy = req.admin.adminId;
            booking.approvalDate = new Date();
            await booking.save({ session });

            // Update truck status
            truck.isAvailable = false;
            truck.bookingStatus = 'assigned';
            await truck.save({ session });

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            // Get updated booking with populated fields
            const updatedBooking = await TruckBooking.findById(bookingId)
                .populate('assignedDriverId', 'fullName phone email')
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
exports.getApprovedTrucks = async (req, res) => {
    try {
        // Get all approved trucks
        const approvedTrucks = await TruckRegistration.find({ status: 'approved' })
            .populate('userId', 'fullName phone email')
            .lean();

        // Get all active bookings with truckIds
        const activeBookings = await TruckBooking.find({
            status: { $in: ['assigned', 'in-progress'] },
            truckId: { $ne: null }
        }).select('truckId status');

        // Create a map of truckIds to their booking status
        const truckStatusMap = new Map();
        activeBookings.forEach(booking => {
            if (booking.truckId) {
                truckStatusMap.set(booking.truckId.toString(), booking.status);
            }
        });

        // Process each truck to determine current status
        const trucksWithStatus = approvedTrucks.map(truck => {
            const isAssigned = truckStatusMap.has(truck._id.toString());
            return {
                ...truck,
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

