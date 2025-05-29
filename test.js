exports.createBooking = async (req, res) => {
  try {
    console.log("Received booking request:", req.body);

    const { from, to, truckTypes, noOfTrucks, weight, materials, scheduledDate } = req.body;
    const userId = req.user?.userId;

    // Input validation
    if (!from || !to || !Array.isArray(truckTypes) || truckTypes.length === 0 || !noOfTrucks || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields: from, to, truckTypes[], noOfTrucks, scheduledDate"
      });
    }

    // Get customer details
    const customer = await User.findById(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Geocode locations
    const [startLocation, endLocation] = await Promise.all([
      LocationService.geocodeAddress(from),
      LocationService.geocodeAddress(to)
    ]);

    if (!startLocation?.coordinates || !endLocation?.coordinates) {
      return res.status(400).json({ success: false, message: "Invalid addresses provided" });
    }

    // Calculate route
    const { distance, duration } = await LocationService.calculateRoute(
      startLocation.coordinates,
      endLocation.coordinates
    );

    if (!distance || isNaN(distance)) {
      return res.status(500).json({ success: false, message: "Failed to calculate distance" });
    }

    // Calculate rate
    const rateDetails = await RateService.calculateSimpleRate(
      truckTypes[0],
      distance,
      noOfTrucks
    );

    if (!rateDetails || !rateDetails.totalRate) {
      return res.status(500).json({ success: false, message: "Failed to calculate rate" });
    }

    // Create booking
    const booking = new TruckBooking({
      userId,
      from,
      to,
      truckTypes,
      noOfTrucks,
      weight,
      materials,
      scheduledDate,
      trackingId: await generateUniqueTrackingId(),
      customerName: customer.fullName,
      customerPhone: customer.phone,
      route: {
        start: startLocation,
        end: endLocation,
        distance,
        estimatedDuration: duration
      },
      rate: rateDetails.totalRate,
      rateDetails
    });

    await booking.save();

    const populatedBooking = await TruckBooking.findById(booking._id)
      .populate('userId', 'fullName phone email')
      .lean();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        ...populatedBooking,
        trackingId: booking.trackingId,
        rateDetails
      }
    });

  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};