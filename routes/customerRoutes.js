const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/customerController");
const verifyToken = require("../Middlewares/authMiddleware");
const {authorizeRoles} = require("../Middlewares/roleMiddleware");
const verifyAdmin = require("../Middlewares/adminAuthMiddleware");

// Truck Booking
router.post("/TruckBooking", verifyToken, authorizeRoles('customer'), customerController.bookTruck);
router.get("/bookings/my", verifyToken, authorizeRoles('customer'), customerController.getMyBookings);
router.get('/bookings/tracking/:trackingId', verifyToken, customerController.getBookingByTrackingId);
router.put('/customer/bookings/:bookingId/cancel', verifyToken, customerController.cancelPendingBooking);


module.exports = router;