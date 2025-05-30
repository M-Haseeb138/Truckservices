const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/customerController");
const verifyToken = require("../Middlewares/authMiddleware");
const {authorizeRoles} = require("../Middlewares/roleMiddleware");
const verifyAdmin = require("../Middlewares/adminAuthMiddleware");

router.post("/TruckBooking", verifyToken, authorizeRoles('customer'), customerController.createBooking);
router.get("/bookings/my", verifyToken, authorizeRoles('customer'), customerController.getMyBookings);
router.get('/bookings/tracking/:trackingId', verifyToken, customerController.getBookingByTrackingId);
router.put('/customer/bookings/:bookingId/cancel', verifyToken, customerController.cancelPendingBooking);
router.get('/getbookingLocation:bookingId', verifyToken, customerController.getBookingLocation);
router.post('/getRateEstimate', verifyToken, customerController.getRateEstimate);
router.get('/places/suggestions', 
  verifyToken, 
  authorizeRoles('customer', 'driver'), 
  customerController.getPlaceSuggestions
);
router.post('/rates/calculate', customerController.calculateCompleteRate);

module.exports = router;