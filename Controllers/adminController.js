const Truck = require("../Models/TruckBooking");
const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const mongoose = require('mongoose');

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
exports.getMatchingDriversForBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const maxDistance = 25; // 25km radius for matching drivers

        console.log(`[MatchingDrivers] Starting search for booking: ${bookingId}`);

        // 1. Get the booking details
        const booking = await TruckBooking.findById(bookingId)
            .select('truckTypes weight materials fromAddress');

        if (!booking) {
            console.log(`[MatchingDrivers] Booking not found: ${bookingId}`);
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (!booking.fromAddress?.coordinates) {
            return res.status(400).json({ success: false, message: "Booking start location is required" });
        }

        const bookingCoords = booking.fromAddress.coordinates;
        console.log(`[MatchingDrivers] Booking coords normalized:`, bookingCoords);

        // 2. Get all currently assigned drivers
        const activeBookings = await TruckBooking.find({
            status: { $in: ['assigned', 'in-progress'] },
            assignedDriverId: { $exists: true }
        });
        const assignedDriverIds = activeBookings.map(b => b.assignedDriverId?.toString()).filter(id => id);

        // 3. Get all approved trucks not currently assigned
        const allPotentialTrucks = await TruckRegistration.find({
            status: 'approved',
            isAvailable: true,
            userId: { $nin: assignedDriverIds }
        }).populate('userId', 'fullName phone email');

        // 4. Filter matching trucks
        const matchingTrucks = allPotentialTrucks.filter(truck => {
            const bookingTruckTypes = booking.truckTypes.map(t => t.toLowerCase().trim());
            const truckType = truck.truckDetails.typeOfTruck.toLowerCase().trim();
            const typeMatches = bookingTruckTypes.some(t => truckType.includes(t) || t.includes(truckType));

            const normalizeWeight = (w) => w?.toString().toLowerCase().replace(/\s+/g, '').replace(/upto|mt|ton|,/gi, '').trim();
            const bookingWeight = normalizeWeight(booking.weight);
            const truckWeight = normalizeWeight(truck.truckDetails.weight);
            const weightMatches = bookingWeight === truckWeight;

            let driverCoords = truck.driverDetails?.address?.coordinates;
            console.log(`[MatchingDrivers] Truck ${truck._id} driver coords normalized:`, driverCoords);

            if (!driverCoords?.lat || !driverCoords?.lng) return false;

            const distance = calculateDistance(
                bookingCoords.lat, bookingCoords.lng,
                driverCoords.lat, driverCoords.lng
            );
            console.log(`[MatchingDrivers] Distance between booking and truck ${truck._id}:`, distance);

            const locationMatches = distance <= maxDistance;

            return typeMatches && weightMatches && locationMatches;
        });

        console.log(`[MatchingDrivers] Found ${matchingTrucks.length} matching trucks`);

        if (matchingTrucks.length === 0) {
            const analysis = {
                totalApprovedTrucks: allPotentialTrucks.length,
                matchingTypeWrongWeight: 0,
                matchingWeightWrongType: 0,
                unavailableButMatching: 0,
                assignedButMatching: 0,
                tooFarButMatching: 0
            };

            allPotentialTrucks.forEach(truck => {
                const bookingTruckTypes = booking.truckTypes.map(t => t.toLowerCase().trim());
                const truckType = truck.truckDetails.typeOfTruck.toLowerCase().trim();
                const typeMatches = bookingTruckTypes.some(t => truckType.includes(t) || t.includes(truckType));

                const normalizeWeight = (w) => w?.toString().toLowerCase().replace(/\s+/g, '').replace(/upto|mt|ton|,/gi, '').trim();
                const bookingWeight = normalizeWeight(booking.weight);
                const truckWeight = normalizeWeight(truck.truckDetails.weight);
                const weightMatches = bookingWeight === truckWeight;

                const driverCoords = truck.driverDetails?.address?.coordinates;
                const locationMatches = driverCoords?.lat && driverCoords?.lng
                    ? calculateDistance(bookingCoords.lat, bookingCoords.lng, driverCoords.lat, driverCoords.lng) <= maxDistance
                    : false;

                if (typeMatches && !weightMatches) analysis.matchingTypeWrongWeight++;
                if (weightMatches && !typeMatches) analysis.matchingWeightWrongType++;
                if (typeMatches && weightMatches && !truck.isAvailable) analysis.unavailableButMatching++;
                if (typeMatches && weightMatches && assignedDriverIds.includes(truck.userId?.toString())) analysis.assignedButMatching++;
                if (typeMatches && weightMatches && !locationMatches) analysis.tooFarButMatching++;
            });

            console.log(`[MatchingDrivers] No matches found. Analysis:`, analysis);
            return res.status(200).json({
                success: true,
                count: 0,
                bookingSummary: {
                    pickupLocation: {
                        address: booking.fromAddress.formattedAddress,
                        coordinates: bookingCoords
                    },
                    truckTypes: booking.truckTypes,
                    weight: booking.weight,
                    materials: booking.materials
                },
                availableDrivers: [],
                matchingAnalysis: analysis,
                maxDistance
            });
        }

        const availableDrivers = matchingTrucks.map(truck => {
            const driverCoords = truck.driverDetails?.address?.coordinates;
            const distance = calculateDistance(
                bookingCoords.lat, bookingCoords.lng,
                driverCoords.lat, driverCoords.lng
            );

            return {
                driver: {
                    id: truck.userId?._id || null,
                    name: truck.userId?.fullName || "N/A",
                    phone: truck.userId?.phone || "N/A",
                    email: truck.userId?.email || "N/A",
                    currentLocation: driverCoords,
                    distanceFromPickupKm: distance
                },
                truck: {
                    id: truck._id,
                    type: truck.truckDetails.typeOfTruck,
                    weightCapacity: truck.truckDetails.weight,
                    registrationCity: truck.truckDetails.Registercity,
                    vehicleNumber: truck.truckDetails.VehicleNo
                }
            };
        }).sort((a, b) => a.driver.distanceFromPickupKm - b.driver.distanceFromPickupKm);

        res.status(200).json({
            success: true,
            count: availableDrivers.length,
            maxDistance,
            bookingSummary: {
                pickupLocation: {
                    address: booking.fromAddress.formattedAddress,
                    coordinates: bookingCoords
                },
                truckTypes: booking.truckTypes,
                weight: booking.weight,
                materials: booking.materials
            },
            availableDrivers
        });

    } catch (error) {
        console.error("[MatchingDrivers] Error finding matching drivers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to find matching drivers",
            error: error.message
        });
    }
};
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
        // Also filter out trucks with no userId
        const approvedTrucks = await TruckRegistration.find({
            status: 'approved',
            isAvailable: true,  // Only available trucks
            userId: {
                $nin: assignedDriverIds,
                $exists: true,
                $ne: null
            }
        }).populate({
            path: 'userId',
            select: 'fullName phone email CNIC role',
            match: { role: 'driver' }  // Only populate if user is a driver
        });

        // 3. Filter out trucks where userId is null after population
        const validTrucks = approvedTrucks.filter(truck => truck.userId !== null);

        // 4. Create a map to group trucks by driver
        const driverMap = new Map();

        validTrucks.forEach(truck => {
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

        // 5. Convert map values to array
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
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

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
            // 1. Validate driver
            const driver = await User.findOne({
                _id: driverId,
                role: 'driver',
                status: 'active'
            }).session(session);

            if (!driver) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "The specified user is not a registered driver"
                });
            }

            // 2. Validate booking
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

            // 3. Validate truck and ownership
            const assignedTruck = await TruckRegistration.findOne({
                _id: truckId,
                userId: driverId,
                status: 'approved'
            }).session(session);

            if (!assignedTruck) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Truck not found, not approved, or doesn't belong to this driver"
                });
            }

            // 4. Ensure truck is not already assigned
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

            // 5. Perform assignment
            booking.assignedDriverId = driverId;
            booking.truckId = truckId;
            booking.status = 'assigned';
            booking.assignedAt = new Date();
            booking.approvedBy = req.admin.adminId;

            assignedTruck.isAvailable = false;
            assignedTruck.bookingStatus = 'assigned';

            await Promise.all([
                booking.save({ session }),
                assignedTruck.save({ session })
            ]);

            await session.commitTransaction();
            session.endSession();

            // 6. Populate full updated booking details
            const updatedBooking = await TruckBooking.findById(bookingId)
                .populate('userId', 'fullName phone email') // Customer info
                .populate('assignedDriverId', 'fullName phone email') // Assigned driver info
                .populate({
                    path: 'truckId',
                    populate: {
                        path: 'userId',
                        select: 'fullName phone email' // Truck owner's (driver's) info
                    }
                });

            // 7. Transform truck data to rename `userId` → `driverId`
            const populatedTruck = updatedBooking.truckId.toObject();
            populatedTruck.driverId = populatedTruck.userId;
            delete populatedTruck.userId;

            // 8. Final shaped response
            const response = {
                ...updatedBooking.toObject(),
                truckId: populatedTruck
            };

            res.status(200).json({
                success: true,
                message: "Driver and truck assigned successfully",
                booking: response
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
exports.getBookingTracking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await TruckBooking.findById(bookingId)
            .select('fromCoordinates toCoordinates currentLocation status trackingId userId assignedDriverId')
            .populate('userId', 'fullName phone')
            .populate('assignedDriverId', 'fullName phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                from: booking.fromCoordinates,
                to: booking.toCoordinates,
                currentLocation: booking.currentLocation,
                status: booking.status,
                trackingId: booking.trackingId,
                customer: booking.userId,
                driver: booking.assignedDriverId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get booking tracking",
            error: error.message
        });
    }
};
exports.getAllActiveTracking = async (req, res) => {
    try {
        const activeBookings = await TruckBooking.find({
            status: { $in: ['assigned', 'in-progress'] }
        })
            .select('trackingId route currentLocation status assignedDriverId userId')
            .populate('assignedDriverId', 'fullName phone')
            .populate('userId', 'fullName phone');

        res.status(200).json({
            success: true,
            count: activeBookings.length,
            data: activeBookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get active tracking",
            error: error.message
        });
    }
};
exports.getTruckLocation = async (req, res) => {
    try {
        const { truckId } = req.params;

        // Find the active booking for this truck
        const booking = await TruckBooking.findOne({
            truckId,
            status: { $in: ['assigned', 'in-progress'] }
        })
            .select('currentLocation trackingId')
            .populate('truckId', 'truckDetails.VehicleNo');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "No active booking found for this truck"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                vehicleNo: booking.truckId.truckDetails.VehicleNo,
                trackingId: booking.trackingId,
                location: booking.currentLocation
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get truck location",
            error: error.message
        });
    }
};
exports.getAllActiveTruckLocations = async (req, res) => {
    try {
        const activeBookings = await TruckBooking.find({
            status: { $in: ['assigned', 'in-progress'] },
            'currentLocation.coordinates': { $exists: true }
        })
            .select('trackingId currentLocation status')
            .populate('truckId', 'truckDetails.VehicleNo truckDetails.typeOfTruck')
            .populate('assignedDriverId', 'fullName phone');

        res.status(200).json({
            success: true,
            count: activeBookings.length,
            data: activeBookings.map(booking => ({
                trackingId: booking.trackingId,
                vehicleNo: booking.truckId?.truckDetails?.VehicleNo,
                truckType: booking.truckId?.truckDetails?.typeOfTruck,
                driver: booking.assignedDriverId
                    ? {
                        name: booking.assignedDriverId.fullName,
                        phone: booking.assignedDriverId.phone
                    }
                    : null,
                location: booking.currentLocation,
                status: booking.status,
                lastUpdated: booking.currentLocation?.timestamp
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get active truck locations",
            error: error.message
        });
    }
};
exports.getTruckLocationHistory = async (req, res) => {
    try {
        const { truckId } = req.params;
        const { hours = 24 } = req.query; // Default to last 24 hours

        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

        const booking = await TruckBooking.findOne({
            truckId,
            status: { $in: ['assigned', 'in-progress', 'completed'] }
        })
            .select('locationHistory trackingId')
            .populate('truckId', 'truckDetails.VehicleNo');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "No booking found for this truck"
            });
        }

        // Filter history by time range
        const filteredHistory = booking.locationHistory.filter(
            loc => loc.timestamp >= cutoffTime
        );

        res.status(200).json({
            success: true,
            data: {
                vehicleNo: booking.truckId.truckDetails.VehicleNo,
                trackingId: booking.trackingId,
                history: filteredHistory,
                pointsCount: filteredHistory.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get location history",
            error: error.message
        });
    }
};
