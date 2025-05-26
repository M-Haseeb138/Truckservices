const TruckBooking = require('../Models/TruckBooking'); 

exports.getTrackingData = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await TruckBooking.findOne({
      _id: bookingId,
      $or: [
        { userId: req.user.userId }, // Customer
        { assignedDriverId: req.user.userId }, // Driver
        {}, // Admin (no condition)
      ]
    }).select('route currentLocation status trackingId');

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
        status: booking.status,
        route: booking.route,
        currentLocation: booking.currentLocation,
        lastUpdated: booking.currentLocation?.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get tracking data",
      error: error.message
    });
  }
};
// Get location history
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




// In trackingController.js
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