const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/adminController");
const verifyToken = require("../Middlewares/authMiddleware");
const { authorizeRoles } = require("../Middlewares/roleMiddleware");

// Truck Approval
router.get("/trucks/pending", verifyToken, authorizeRoles('admin'), adminController.getPendingTrucks);
router.post("/trucks/approve/:truckId", verifyToken, authorizeRoles('admin'), adminController.approveTruck);

// Driver Management
router.get("/drivers", verifyToken, authorizeRoles('admin'), adminController.getAllDrivers);

router.get("/bookings/pending", verifyToken, authorizeRoles('admin'), adminController.getPendingBookings);
router.post("/bookings/approve/:bookingId/:truckId", verifyToken, authorizeRoles('admin'), adminController.approveBooking);

module.exports = router;