const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const LocationService = require('../services/locationService');
const mongoose = require('mongoose');
exports.getMyTrucks = async (req, res) => {
    try {
        console.log("Current user ID:", req.user.userId); // ✅ Use userId
        console.log("User ID type:", typeof req.user.userId);

        const trucks = await TruckRegistration.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
            .select('-__v')
        console.log("Found trucks:", trucks);

            if (!trucks || trucks.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: "No trucks registered yet",
                data: [] 
            });
        }

         res.status(200).json({
            success: true,
            count: trucks.length,
            data: trucks
        });
    } catch (error) {
      console.error(`Error fetching trucks for user ${req.user.userId}:`, error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch trucks",
            error: error.message
    })
};
}
// Get all assigned and in-progress jobs for driver
exports.getDriverAssignments = async (req, res) => {
    try {
        const assignments = await TruckBooking.find({
            assignedDriverId: req.user.userId,
            status: { $in: ['assigned', 'in-progress'] }
        })
        .populate('userId', 'fullName phone')
        .populate('truckId', 'truckDetails.VehicleNo')
        .sort({ scheduledDate: 1 });

        res.status(200).json({
            success: true,
            count: assignments.length,
            assignments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get assignments",
            error: error.message
        });
    }
};
// Update assignment status (for drivers)
exports.updateAssignmentStatus = async (req, res) => {
    try {
        const { bookingId, status, notes } = req.body;

        // Validate booking exists and belongs to this driver
        const booking = await TruckBooking.findOne({
            _id: bookingId,
            assignedDriverId: req.user.userId
        }).populate('truckId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        // Validate status transition
        const validTransitions = {
            'assigned': ['in-progress', 'cancelled'],
            'in-progress': ['completed', 'cancelled']
        };

        if (!validTransitions[booking.status] || !validTransitions[booking.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${booking.status} to ${status}`
            });
        }

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update booking status
            booking.status = status;
            
            // Record status change
            booking.statusHistory.push({
                status,
                changedAt: new Date(),
                changedBy: req.user.userId,
                notes
            });

            // Set specific timestamps
            if (status === 'in-progress') {
                booking.startedAt = new Date();
            } else if (status === 'completed') {
                booking.completedAt = new Date();
                if (booking.truckId) {
                    booking.truckId.isAvailable = true;
                    await booking.truckId.save({ session });
                }
            }

            await booking.save({ session });
            await session.commitTransaction();
            session.endSession();

            // TODO: Send notification to customer about status change

            res.status(200).json({
                success: true,
                message: "Status updated successfully",
                booking
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Update failed",
            error: error.message
        });
    }
};
// exports.registerTruck = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.userId);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         // Validate required files
//         const requiredFiles = [
//             'idCardFrontImage',
//             'idCardBackImage',
//             'licenseFrontImage',
//             'TruckPicture',
//             'Truckdocument'
//         ];

//         const missingFiles = requiredFiles.filter(
//             file => !req.files?.[file]?.[0]?.path
//         );

//         if (missingFiles.length > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Missing required files: ${missingFiles.join(', ')}`
//             });
//         }

//         // Parse driver address
//         let driverAddress = {};
//         try {
//             if (typeof req.body.driverAddress === 'string') {
//                 driverAddress = JSON.parse(req.body.driverAddress);
//             } else if (req.body.driverAddress) {
//                 driverAddress = req.body.driverAddress;
//             }
//         } catch (error) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid driver address format"
//             });
//         }

//         // Validate mandatory driver fields
//         const requiredDriverFields = ['driverDateOfBirth', 'driverProvince', 'lisenceNo'];
//         const missingDriverFields = requiredDriverFields.filter(
//             field => !req.body[field]
//         );

//         if (missingDriverFields.length > 0 || !driverAddress.address) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Driver's province, address, date of birth, and license number are required"
//             });
//         }

//         // Validate mandatory owner fields
//         const requiredOwnerFields = ['truckOwnerName', 'ownerMobileNo', 'ownerDateOfBirth', 'ownerProvince', 'ownerAddress'];
//         const missingOwnerFields = requiredOwnerFields.filter(
//             field => !req.body[field]
//         );

//         if (missingOwnerFields.length > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Owner name, mobile, DOB, province, and address are required"
//             });
//         }

//         // Construct driver details
//         const driverDetails = {
//             truckDriverName: user.fullName,
//             mobileNo: user.phone,
//             email: user.email,
//             CNIC: user.CNIC,
//             dateOfBirth: req.body.driverDateOfBirth,
//             province: req.body.driverProvince,
//             address: {
//                 formattedAddress: driverAddress.address || '',
//                 coordinates: driverAddress.coordinates || { lat: null, lng: null }
//             },
//             lisenceNo: req.body.lisenceNo || ''
//         };

//         // Construct owner details
//         const ownerDetails = {
//             truckOwnerName: req.body.truckOwnerName,
//             mobileNo: req.body.ownerMobileNo,
//             dateOfBirth: req.body.ownerDateOfBirth,
//             province: req.body.ownerProvince,
//             address: req.body.ownerAddress
//         };

//         // Create new truck registration document
//         const newTruck = new TruckRegistration({
//             ownerDetails,
//             driverDetails,
//             idCardFrontImage: req.files.idCardFrontImage[0].path,
//             idCardBackImage: req.files.idCardBackImage[0].path,
//             licenseFrontImage: req.files.licenseFrontImage[0].path,
//             TruckPicture: req.files.TruckPicture[0].path,
//             truckDetails: {
//                 typeOfTruck: req.body.typeOfTruck,
//                 weight: req.body.weight,
//                 Registercity: req.body.Registercity,
//                 VehicleNo: req.body.VehicleNo,
//                 Truckdocument: req.files.Truckdocument[0].path
//             },
//             userId: req.user.userId,
//             status: 'pending'
//         });

//         const savedTruck = await newTruck.save();

//         res.status(201).json({
//             success: true,
//             message: "Truck registration submitted for approval",
//             truck: savedTruck
//         });

//     } catch (error) {
//         console.error("Truck registration error:", error);

//         if (error.name === 'ValidationError') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation failed",
//                 error: error.message
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: "Truck registration failed",
//             error: error.message
//         });
//     }
// };

// Complete a booking

exports.registerTruck = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Parse driverAddress if it's a string
        let driverAddress = {};
        try {
            driverAddress = typeof req.body.driverAddress === 'string'
                ? JSON.parse(req.body.driverAddress)
                : req.body.driverAddress || {};
        } catch (error) {
            driverAddress = {
                formattedAddress: '',
                coordinates: { lat: null, lng: null }
            };
        }

        // Construct driver details
        const driverDetails = {
            truckDriverName: user.fullName,
            mobileNo: user.phone,
            email: user.email,
            CNIC: user.CNIC,
            dateOfBirth: req.body.driverDateOfBirth,
            province: req.body.driverProvince,
            address: {
                formattedAddress: driverAddress.formattedAddress || '',
                coordinates: {
                    lat: driverAddress.coordinates?.lat || null,
                    lng: driverAddress.coordinates?.lng || null
                }
            },
            lisenceNo: req.body.lisenceNo || ''
        };

        // Construct owner details
        const ownerDetails = {
            truckOwnerName: req.body.truckOwnerName,
            mobileNo: req.body.ownerMobileNo,
            dateOfBirth: req.body.ownerDateOfBirth,
            province: req.body.ownerProvince,
            address: req.body.ownerAddress,
            country: req.body.ownerCountry || ''
        };

        // Create new truck registration document
        const newTruck = new TruckRegistration({
            ownerDetails,
            driverDetails,
            idCardFrontImage: req.files?.idCardFrontImage?.[0]?.path || '',
            idCardBackImage: req.files?.idCardBackImage?.[0]?.path || '',
            licenseFrontImage: req.files?.licenseFrontImage?.[0]?.path || '',
            TruckPicture: req.files?.TruckPicture?.[0]?.path || '',
            truckDetails: {
                typeOfTruck: req.body.typeOfTruck,
                weight: req.body.weight,
                Registercity: req.body.Registercity,
                VehicleNo: req.body.VehicleNo,
                Truckdocument: req.files?.Truckdocument?.[0]?.path || ''
            },
            userId: req.user.userId,
            status: 'pending'
        });

        const savedTruck = await newTruck.save();

        res.status(201).json({
            success: true,
            message: "Truck registration submitted successfully",
            truck: savedTruck
        });

    } catch (error) {
        console.error("Truck registration error:", error);
        res.status(500).json({
            success: false,
            message: "Truck registration failed",
            error: error.message
        });
    }
};
exports.completeBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the booking
            const booking = await TruckBooking.findById(bookingId).session(session);
            if (!booking) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            // Validate booking status
            if (booking.status === 'completed') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Booking is already completed"
                });
            }

            if (booking.status === 'cancelled') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: "Cancelled bookings cannot be completed"
                });
            }

            // Update booking status
            booking.status = 'completed';
            booking.completedAt = new Date();
            booking.completedBy = req.user.userId;
            await booking.save({ session });

            // Make the truck available again
            if (booking.truckId) {
                await TruckRegistration.findByIdAndUpdate(
                    booking.truckId,
                    {
                        isAvailable: true,
                        bookingStatus: 'available'
                    },
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();

            // Get populated booking with refined structure
            const updatedBooking = await TruckBooking.findById(bookingId)
                .populate('userId', 'fullName phone email')
                .populate('assignedDriverId', 'fullName phone')
                .populate({
                    path: 'truckId',
                    select: 'truckDetails driverDetails ownerDetails TruckPicture status'
                });

            // Format the response
            const response = {
                success: true,
                message: "Booking completed successfully",
                data: {
                    bookingInfo: {
                        _id: updatedBooking._id,
                        trackingId: updatedBooking.trackingId,
                        status: updatedBooking.status,
                        scheduledDate: updatedBooking.scheduledDate,
                        completedAt: updatedBooking.completedAt,
                        assignedAt: updatedBooking.assignedAt,
                        createdAt: updatedBooking.createdAt
                    },
                    routeDetails: {
                        from: {
                            address: updatedBooking.route?.start?.address || updatedBooking.from,
                            coordinates: updatedBooking.route?.start?.coordinates
                        },
                        to: {
                            address: updatedBooking.route?.end?.address || updatedBooking.to,
                            coordinates: updatedBooking.route?.end?.coordinates
                        },
                        distance: updatedBooking.route?.distance,
                        duration: updatedBooking.route?.estimatedDuration
                    },
                    customerDetails: {
                        _id: updatedBooking.userId?._id,
                        name: updatedBooking.userId?.fullName || updatedBooking.customerName,
                        phone: updatedBooking.userId?.phone || updatedBooking.customerPhone,
                        email: updatedBooking.userId?.email
                    },
                    cargoDetails: {
                        materials: updatedBooking.materials,
                        weight: updatedBooking.weight,
                        truckType: updatedBooking.truckTypes?.[0] || 'N/A',
                        noOfTrucks: updatedBooking.noOfTrucks
                    },
                    driverDetails: {
                        _id: updatedBooking.assignedDriverId?._id,
                        name: updatedBooking.assignedDriverId?.fullName,
                        phone: updatedBooking.assignedDriverId?.phone
                    },
                    truckDetails: updatedBooking.truckId ? {
                        vehicleNo: updatedBooking.truckId.truckDetails?.VehicleNo,
                        type: updatedBooking.truckId.truckDetails?.typeOfTruck,
                        weightCapacity: updatedBooking.truckId.truckDetails?.weight,
                        picture: updatedBooking.truckId.TruckPicture,
                        status: updatedBooking.truckId.status
                    } : null,
                    paymentDetails: {
                        totalAmount: updatedBooking.rate,
                        rateBreakdown: updatedBooking.rateDetails || {
                            baseRatePerKm: null,
                            minimumCharge: null,
                            calculatedDistance: null,
                            noOfTrucks: null,
                            currency: 'PKR'
                        }
                    },
                    timeline: {
                        created: updatedBooking.createdAt,
                        assigned: updatedBooking.assignedAt,
                        completed: updatedBooking.completedAt
                    }
                }
            };

            res.status(200).json(response);

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.error("Error completing booking:", {
            error: error.message,
            bookingId: req.params.bookingId,
            userId: req.user?.userId,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: "Failed to complete booking",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
// Driver starts trip (sets starting point)
exports.startTrip = async (req, res) => {
  try {
    const { bookingId, lat, lng } = req.body;
    const driverId = req.user.userId; // Get from authenticated user

    // Get address from coordinates
    const address = await LocationService.reverseGeocode(lat, lng);

    // Update booking with starting point
    const booking = await TruckBooking.findOneAndUpdate(
      {
        _id: bookingId,
        assignedDriverId: driverId,
        status: 'assigned' // Correct status check
      },
      {
        $set: {
          status: 'in-progress',
          'currentLocation': {
            coordinates: { lat, lng },
            address,
            timestamp: new Date()
          },
          'route.actualStart': {
            coordinates: { lat, lng },
            address,
            timestamp: new Date()
          }
        },
        $push: {
          statusHistory: {
            status: 'in-progress',
            changedAt: new Date(),
            changedBy: driverId,
            notes: 'Trip started by driver'
          }
        }
      },
      { new: true }
    ).populate('truckId', 'truckDetails.VehicleNo');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found, not assigned to you, or not in 'assigned' status"
      });
    }

    res.status(200).json({
      success: true,
      message: "Trip started successfully",
      data: {
        bookingId: booking._id,
        trackingId: booking.trackingId,
        vehicleNo: booking.truckId.truckDetails.VehicleNo,
        currentLocation: booking.currentLocation,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to start trip",
      error: error.message
    });
  }
};
exports.setUpdateFrequency = async (req, res) => {
  try {
    const { frequency } = req.body; // in seconds
    await User.findByIdAndUpdate(req.user.userId, { 
      locationUpdateFrequency: frequency 
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { bookingId, lat, lng } = req.body;

    // Verify booking assignment
    const booking = await TruckBooking.findOneAndUpdate(
      {
        _id: bookingId,
        assignedDriverId: req.user.userId,
        status: 'in-progress'
      },
      {
        currentLocation: {
          coordinates: { lat, lng },
          address: await LocationService.reverseGeocode(lat, lng),
          timestamp: new Date()
        },
        $push: {
          locationHistory: {
            coordinates: { lat, lng },
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Active booking not found"
      });
    }

    // Broadcast to WebSocket clients
    if (req.app.locals.wss) {
      req.app.locals.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && 
            client.trackingBookingId === bookingId) {
          client.send(JSON.stringify({
            type: 'location-update',
            location: booking.currentLocation,
            progress: calculateProgress(booking)
          }));
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: error.message
    });
  }
};
exports.updateDriverLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        // Validate coordinates
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude and longitude are required"
            });
        }

        // Get address from coordinates
        let address;
        try {
            address = await LocationService.reverseGeocode(lat, lng);
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            address = "Address not available";
        }

        // Update driver's location
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $set: {
                    currentLocation: {
                        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
                        address: address,
                        timestamp: new Date()
                    }
                },
                // Initialize locationUpdateFrequency if it doesn't exist
                $setOnInsert: {
                    locationUpdateFrequency: 60 // default value
                }
            },
            { 
                new: true,
                upsert: false // Don't create new document if not exists
            }
        ).select('currentLocation role');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            location: updatedUser.currentLocation
        });

    } catch (error) {
        console.error("Error updating driver location:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update location",
            error: error.message
        });
    }
};
// Get nearby drivers (for admin/customer use)
exports.getNearbyDrivers = async (req, res) => {
    try {
        const { lat, lng, radius = 25 } = req.query; // radius in km
        
        // Validate coordinates
        if (!lat || !lng || isNaN(lat) || isNaN(lng) || isNaN(radius)) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude, longitude and radius are required"
            });
        }

        const centerPoint = {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
        };

        // Find drivers within radius
        const nearbyDrivers = await User.find({
            role: 'driver',
            status: 'active',
            currentLocation: {
                $exists: true,
                $ne: null
            },
            'currentLocation.coordinates': {
                $exists: true,
                $ne: null
            }
        }).where('currentLocation.coordinates').near({
            center: centerPoint,
            maxDistance: radius * 1000, // convert km to meters
            spherical: true
        }).select('fullName phone currentLocation');

        res.status(200).json({
            success: true,
            count: nearbyDrivers.length,
            drivers: nearbyDrivers.map(driver => ({
                id: driver._id,
                fullName: driver.fullName,
                phone: driver.phone,
                location: driver.currentLocation,
                distance: calculateDistance(
                    lat,
                    lng,
                    driver.currentLocation.coordinates.lat,
                    driver.currentLocation.coordinates.lng
                )
            })).sort((a, b) => a.distance - b.distance)
        });

    } catch (error) {
        console.error("Error getting nearby drivers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get nearby drivers",
            error: error.message
        });
    }
};
// Helper function to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

exports.getDriverBookingStatusSummary = async (req, res) => {
    try {
        const driverId = req.user.userId; // Get logged-in driver's ID
        
        // Verify the user is actually a driver
        const driver = await User.findById(driverId);
        if (!driver || driver.role !== 'driver') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only drivers can view their bookings."
            });
        }

        // Get ongoing bookings (assigned + in-progress) for this driver
        const ongoingBookings = await TruckBooking.find({
            assignedDriverId: driverId,
            status: { $in: ['assigned', 'in-progress'] }
        })
        .populate('userId', 'fullName phone')
        .populate('truckId', 'truckDetails.VehicleNo truckDetails.typeOfTruck')
        .sort({ createdAt: -1 });

        // Get completed bookings for this driver
        const completedBookings = await TruckBooking.find({
            assignedDriverId: driverId,
            status: 'completed'
        })
        .populate('userId', 'fullName phone')
        .populate('truckId', 'truckDetails.VehicleNo truckDetails.typeOfTruck')
        .sort({ completedAt: -1 })
        .limit(50);

        // Format response to match the desired structure
        const response = {
            success: true,
            driver: {
                id: driver._id.toString(),
                name: driver.fullName,
                phone: driver.phone
            },
            bookings: {
                ongoing: ongoingBookings.map(booking => {
                    const rateDetails = booking.rateDetails || {};
                    const pickupCoords = booking.fromAddress?.coordinates || 
                                       booking.route?.start?.coordinates || 
                                       { lat: null, lng: null };
                    const deliveryCoords = booking.toAddress?.coordinates || 
                                         booking.route?.end?.coordinates || 
                                         { lat: null, lng: null };
                    
                    return {
                        bookingId: booking._id.toString(),
                        trackingId: booking.trackingId,
                        pickupLocation: {
                            address: booking.fromAddress?.formattedAddress || 
                                    booking.route?.start?.address || 
                                    booking.from,
                            coordinates: {
                                lat: pickupCoords.lat,
                                lng: pickupCoords.lng
                            },
                            timestamp: booking.scheduledDate?.toISOString() || new Date().toISOString()
                        },
                        deliveryLocation: {
                            address: booking.toAddress?.formattedAddress || 
                                    booking.route?.end?.address || 
                                    booking.to,
                            coordinates: {
                                lat: deliveryCoords.lat,
                                lng: deliveryCoords.lng
                            }
                        },
                        customer: {
                            name: booking.userId?.fullName,
                            phone: booking.userId?.phone,
                            id: booking.userId?._id.toString()
                        },
                        truck: {
                            id: booking.truckId?._id.toString(),
                            vehicleNo: booking.truckId?.truckDetails?.VehicleNo,
                            type: booking.truckId?.truckDetails?.typeOfTruck
                        },
                        cargoDetails: {
                            materials: booking.materials || booking.cargoDetails?.materials || ["Building Materials"],
                            weight: booking.weight || booking.cargoDetails?.weight || "Upto 12 MT",
                            truckTypes: booking.truckTypes || [booking.truckId?.truckDetails?.typeOfTruck] || ["Boom Truck-16Ft"]
                        },
                        pricing: {
                            totalAmount: booking.rate,
                            currency: rateDetails.currency || 'PKR',
                            ratePerKm: rateDetails.baseRatePerKm,
                            distanceKm: rateDetails.calculatedDistance,
                            minimumCharge: rateDetails.minimumCharge,
                            noOfTrucks: rateDetails.noOfTrucks || 1
                        },
                        status: booking.status,
                        actionsAvailable: booking.status === 'assigned' 
                            ? ["start-trip", "cancel"] 
                            : ["complete-trip", "update-location"]
                    };
                }),
                completed: completedBookings.map(booking => {
                    const rateDetails = booking.rateDetails || {};
                    const durationHours = booking.startedAt && booking.completedAt 
                        ? ((booking.completedAt - booking.startedAt) / (1000 * 60 * 60)).toFixed(1)
                        : null;
                    
                    const pickupCoords = booking.fromAddress?.coordinates || 
                                       booking.route?.start?.coordinates || 
                                       { lat: null, lng: null };
                    const deliveryCoords = booking.toAddress?.coordinates || 
                                         booking.route?.end?.coordinates || 
                                         { lat: null, lng: null };

                    return {
                        bookingId: booking._id.toString(),
                        trackingId: booking.trackingId,
                        pickupLocation: {
                            address: booking.fromAddress?.formattedAddress || 
                                    booking.route?.start?.address || 
                                    booking.from,
                            coordinates: {
                                lat: pickupCoords.lat,
                                lng: pickupCoords.lng
                            },
                            timestamp: booking.scheduledDate?.toISOString() || new Date().toISOString()
                        },
                        deliveryLocation: {
                            address: booking.toAddress?.formattedAddress || 
                                    booking.route?.end?.address || 
                                    booking.to,
                            coordinates: {
                                lat: deliveryCoords.lat,
                                lng: deliveryCoords.lng
                            }
                        },
                        customer: {
                            name: booking.userId?.fullName,
                            phone: booking.userId?.phone,
                            id: booking.userId?._id.toString()
                        },
                        truck: {
                            id: booking.truckId?._id.toString(),
                            vehicleNo: booking.truckId?.truckDetails?.VehicleNo,
                            type: booking.truckId?.truckDetails?.typeOfTruck
                        },
                        cargoDetails: {
                            materials: booking.materials || booking.cargoDetails?.materials || ["Building Materials"],
                            weight: booking.weight || booking.cargoDetails?.weight || "Upto 12 MT",
                            truckTypes: booking.truckTypes || [booking.truckId?.truckDetails?.typeOfTruck] || ["Boom Truck-16Ft"]
                        },
                        pricing: {
                            totalAmount: booking.rate,
                            currency: rateDetails.currency || 'PKR',
                            ratePerKm: rateDetails.baseRatePerKm,
                            distanceKm: rateDetails.calculatedDistance,
                            minimumCharge: rateDetails.minimumCharge,
                            noOfTrucks: rateDetails.noOfTrucks || 1
                        },
                        status: booking.status,
                        timeline: {
                            assignedAt: booking.assignedAt?.toISOString(),
                            startedAt: booking.startedAt?.toISOString(),
                            completedAt: booking.completedAt?.toISOString(),
                            duration: durationHours ? `${durationHours} hours` : 'N/A'
                        }
                    };
                })
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("🔴 Error in getDriverBookingStatusSummary:", {
            error: error.message,
            userId: req.user?.userId,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: "Failed to get booking summary",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};