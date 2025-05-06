const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/customerController");
const verifyToken = require("../Middlewares/authMiddleware");
const {authorizeRoles} = require("../Middlewares/roleMiddleware");

// Truck Booking
router.post("/TruckBooking", verifyToken, authorizeRoles('customer'), customerController.bookTruck);
router.get("/bookings/my", verifyToken, authorizeRoles('customer'), customerController.getMyBookings);

module.exports = router;