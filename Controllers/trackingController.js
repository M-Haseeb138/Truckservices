const TruckBooking = require('../Models/TruckBooking');
const User = require('../Models/userModel');


exports.getLocationHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await TruckBooking.findOne({
      _id: bookingId,
      $or: [
        { userId: req.user.userId }, // Customer
        { assignedDriverId: req.user.userId }, // Driver
        {}, // Admin (no condition)
      ]
    }).select('locationHistory trackingId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        trackingId: booking.trackingId,
        history: booking.locationHistory
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
exports.setupTrackingSocket = (io) => {
  io.on('connection', (socket) => {
    // Admin joins tracking room
    socket.on('admin-join-tracking', async (token) => {
      try {
        // Verify admin token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') throw new Error('Unauthorized');

        socket.join('admin-tracking-room');
        socket.emit('tracking-authorized');
      } catch (error) {
        socket.emit('tracking-error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Driver updates location
    socket.on('driver-update-location', async (data) => {
      try {
        const { bookingId, lat, lng, token } = data;

        // Verify driver token and booking assignment
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const booking = await TruckBooking.findOne({
          _id: bookingId,
          assignedDriverId: decoded.userId
        });

        if (!booking) throw new Error('Invalid booking');

        // Get address from coordinates
        const address = await LocationService.reverseGeocode(lat, lng);

        // Update booking location
        booking.currentLocation = {
          coordinates: { lat, lng },
          address,
          timestamp: new Date()
        };

        booking.locationHistory.push({
          coordinates: { lat, lng },
          address,
          timestamp: new Date()
        });

        await booking.save();

        // Broadcast to admin room
        io.to('admin-tracking-room').emit('location-update', {
          bookingId,
          location: booking.currentLocation,
          vehicleNo: booking.truckId?.truckDetails?.VehicleNo
        });

        socket.emit('location-update-success');
      } catch (error) {
        socket.emit('location-update-error', { message: error.message });
      }
    });
  });
};
exports.getBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Find the booking with all necessary populated data
        const booking = await TruckBooking.findById(bookingId)
            .populate('userId', 'fullName phone email') // Customer details
            .populate('assignedDriverId', 'fullName phone email currentLocation') // Driver details
            .populate('truckId', 'truckDetails.VehicleNo truckDetails.typeOfTruck'); // Truck details

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Authorization check - only customer, driver, or admin can view
        const isAuthorized = (
            req.user.role === 'admin' ||
            booking.userId._id.toString() === req.user.userId.toString() ||
            (booking.assignedDriverId && booking.assignedDriverId._id.toString() === req.user.userId.toString())
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to view this booking"
            });
        }

        // Format the response
        const response = {
            success: true,
            data: {
                bookingId: booking._id,
                trackingId: booking.trackingId,
                status: booking.status,
                origin: {
                    address: booking.fromAddress.formattedAddress,
                    coordinates: booking.fromAddress.coordinates,
                    timestamp: booking.scheduledDate
                },
                destination: {
                    address: booking.toAddress.formattedAddress,
                    coordinates: booking.toAddress.coordinates
                },
                currentLocation: booking.currentLocation || null,
                driver: booking.assignedDriverId ? {
                    id: booking.assignedDriverId._id,
                    name: booking.assignedDriverId.fullName,
                    phone: booking.assignedDriverId.phone,
                    currentLocation: booking.assignedDriverId.currentLocation
                } : null,
                customer: {
                    id: booking.userId._id,
                    name: booking.userId.fullName,
                    phone: booking.userId.phone,
                    email: booking.userId.email
                },
                truck: booking.truckId ? {
                    id: booking.truckId._id,
                    vehicleNo: booking.truckId.truckDetails.VehicleNo,
                    type: booking.truckId.truckDetails.typeOfTruck
                } : null,
                lastUpdated: booking.updatedAt
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error("Error getting booking status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get booking status",
            error: error.message
        });
    }
};