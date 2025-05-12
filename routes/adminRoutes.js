const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/adminController");
const verifyToken = require("../Middlewares/authMiddleware");
const { authorizeRoles } = require("../Middlewares/roleMiddleware");
const verifyAdmin = require("../Middlewares/adminAuthMiddleware");

// Truck Approval
router.get("/trucks/pending", verifyToken, authorizeRoles('admin'), adminController.getPendingTrucks);
router.post("/trucks/approve/:truckId", verifyAdmin, authorizeRoles('admin'), adminController.approveTruck);

// Driver Management
router.get("/getalldrivers", verifyToken, authorizeRoles('admin'), adminController.getAllDrivers);
router.get("/drivers/available", verifyToken, authorizeRoles('admin'), adminController.getAvailableDrivers);
router.get("/bookings/pending", verifyToken, authorizeRoles('admin'), adminController.getPendingBookings);
router.post("/bookings/approve/:bookingId/:truckId", verifyToken, authorizeRoles('admin'), adminController.approveBooking);
router.post("/bookings/assign", verifyToken, authorizeRoles('admin'), adminController.assignDriver);
// router.get('/drivers/pending', verifyToken, authorizeRoles('admin'), adminController.getPendingDrivers);
// router.put('/drivers/approve/:driverId', verifyToken, authorizeRoles('admin'), adminController.approveDriver);
router.get("/dashboard/stats", verifyToken, authorizeRoles('admin'), adminController.getDashboardStats);

router.get('/trucks/available', 
    verifyToken, 
    authorizeRoles('admin'), 
    adminController.getAvailableTrucks
  );
  router.get('/bookings/:bookingId/available-trucks',
    verifyToken,
    authorizeRoles('admin'),
    adminController.getAvailableTrucksForBooking
  );
  
module.exports = router;




