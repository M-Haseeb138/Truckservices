const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/customerController");
const verifyToken = require("../Middlewares/authMiddleware");
const {authorizeRoles} = require("../Middlewares/roleMiddleware");
const verifyAdmin = require("../Middlewares/adminAuthMiddleware");

// Truck Booking
router.post("/TruckBooking", verifyToken, authorizeRoles('customer'), customerController.bookTruck);
router.get("/bookings/my", verifyToken, authorizeRoles('customer'), customerController.getMyBookings);
router.put('/bookings/cancel/:bookingId', 
    verifyToken, 
    authorizeRoles('customer'), 
    customerController.cancelBooking
  );

router.get('/bookings/tracking/:trackingId', verifyToken, customerController.getBookingByTrackingId);

module.exports = router;