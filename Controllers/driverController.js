const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const LocationService = require('../services/locationService');
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
exports.registerTruck = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Validate required files
        const requiredFiles = [
            'idCardFrontImage',
            'idCardBackImage',
            'licenseFrontImage',
            'TruckPicture',
            'Truckdocument'
        ];

        const missingFiles = requiredFiles.filter(
            file => !req.files?.[file]?.[0]?.path
        );

        if (missingFiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required files: ${missingFiles.join(', ')}`
            });
        }

        // Driver details
        const driverDetails = {
            truckDriverName: user.fullName,
            mobileNo: user.phone,
            email: user.email,
            CNIC: user.CNIC,
            dateOfBirth: req.body.driverDateOfBirth,
            province: req.body.driverProvince,
            address: req.body.driverAddress,
            country: req.body.driverCountry,
            city: req.body.driverCity || '',
            lisenceNo: req.body.lisenceNo || ''
        };

        // Owner details
        const ownerDetails = {
            truckOwnerName: req.body.truckOwnerName,
            mobileNo: req.body.ownerMobileNo,
            dateOfBirth: req.body.ownerDateOfBirth,
            province: req.body.ownerProvince,
            address: req.body.ownerAddress,
            country: req.body.ownerCountry
        };

        // Validate mandatory driver fields
        if (!driverDetails.dateOfBirth || !driverDetails.province || !driverDetails.address || !driverDetails.country) {
            return res.status(400).json({
                success: false,
                message: "Driver's province, country, address, and date of birth are required"
            });
        }

        // Validate mandatory owner fields
        if (!ownerDetails.truckOwnerName || !ownerDetails.mobileNo || !ownerDetails.dateOfBirth || 
            !ownerDetails.province || !ownerDetails.address || !ownerDetails.country) {
            return res.status(400).json({
                success: false,
                message: "Owner name, mobile, DOB, province, address, and country are required"
            });
        }

        // Build Truck object with all image paths
        const newTruck = new TruckRegistration({
            ownerDetails,
            driverDetails,
            idCardFrontImage: req.files.idCardFrontImage[0].path,
            idCardBackImage: req.files.idCardBackImage[0].path,
            licenseFrontImage: req.files.licenseFrontImage[0].path,
            TruckPicture: req.files.TruckPicture[0].path,
            truckDetails: {
                typeOfTruck: req.body.typeOfTruck,
                weight: req.body.weight,
                Registercity: req.body.Registercity,
                VehicleNo: req.body.VehicleNo,
                Truckdocument: req.files.Truckdocument[0].path
            },
            userId: req.user.userId,
            status: 'pending'
        });

        // Save to database
        const savedTruck = await newTruck.save();

        // Return success response with all image URLs included in truckDetails
        res.status(201).json({
            success: true,
            message: "Truck registration submitted for approval",
            truck: {
                _id: savedTruck._id,
                ownerDetails: savedTruck.ownerDetails,
                driverDetails: savedTruck.driverDetails,
                truckDetails: {
                    ...savedTruck.truckDetails.toObject(),
                    idCardFrontImage: savedTruck.idCardFrontImage,
                    idCardBackImage: savedTruck.idCardBackImage,
                    licenseFrontImage: savedTruck.licenseFrontImage,
                    TruckPicture: savedTruck.TruckPicture
                },
                status: savedTruck.status,
                createdAt: savedTruck.createdAt
            }
        });

    } catch (error) {
        console.error("Truck registration error:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Truck registration failed",
            error: error.message
        });
    }
};
// Complete a booking
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

            // Check if booking can be completed
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
            booking.completedBy = req.admin.adminId;
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

            const updatedBooking = await TruckBooking.findById(bookingId)
                .populate('userId', 'fullName phone email')
                .populate('assignedDriverId', 'fullName phone')
                .populate('truckId');

            res.status(200).json({
                success: true,
                message: "Booking completed successfully",
                booking: updatedBooking
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.error("Error completing booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to complete booking",
            error: error.message
        });
    }
};
// Driver starts trip (sets starting point)
// In driverController.js
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

// In driverController.js
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

// In driverController.js
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