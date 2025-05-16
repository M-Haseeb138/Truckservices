const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/adminController");
const verifyToken = require("../Middlewares/authMiddleware");
const { authorizeRoles } = require("../Middlewares/roleMiddleware");
const verifyAdmin = require("../Middlewares/adminAuthMiddleware");

// Truck Approval
router.get("/trucks/pending",verifyAdmin , authorizeRoles('admin'), adminController.getPendingTrucks);
router.post("/trucks/approve/:truckId", verifyAdmin, authorizeRoles('admin'), adminController.approveTruck);
router.get("/trucks/getapprovetrucks", verifyAdmin, authorizeRoles('admin'), adminController.getApprovedTrucks);
router.post("/trucks/rejectTruck/:truckId", verifyAdmin, authorizeRoles('admin'), adminController.rejectTruck);
router.get("/trucks/getrejectedtrucks", verifyAdmin, authorizeRoles('admin'), adminController.getRejectedTrucks);

// Driver Management
// router.get("/getalldrivers", verifyToken, authorizeRoles('admin'), adminController.getAllDrivers);
// router.get("/drivers/available", verifyToken, authorizeRoles('admin'), adminController.getAvailableDrivers);
router.get("/bookings/pending", verifyAdmin, authorizeRoles('admin'), adminController.getPendingBookings);
router.post("/bookings/approve/:bookingId/:truckId", verifyToken, authorizeRoles('admin'), adminController.approveBooking);
router.get("/bookings/approved-drivers", verifyAdmin, authorizeRoles('admin'), adminController.getApprovedDrivers);
router.get('/bookings/:bookingId/matching-drivers',verifyAdmin, adminController.getMatchingDriversForBooking);
router.post('/bookings/assign-driver', verifyAdmin, adminController.assignDriverToBooking);
router.get('/getAllDrivers', verifyAdmin, adminController.getAllDrivers);
router.get('/getAllsuspendedDriver', verifyAdmin, adminController.getAllsuspendedDriver);
router.post('/suspendDriver/:driverId', verifyAdmin, adminController.suspendDriver);
router.post('/RestoredDriver/:driverId', verifyAdmin, adminController.restoresuspendedDriver);



// User Management 
router.get("/getRegisteredCustomers", verifyAdmin, authorizeRoles('admin'), adminController.getRegisteredCustomers);







// router.post("/bookings/assign", verifyToken, authorizeRoles('admin'), adminController.assignDriver);
// router.get('/drivers/pending', verifyToken, authorizeRoles('admin'), adminController.getPendingDrivers);
// router.put('/drivers/approve/:driverId', verifyToken, authorizeRoles('admin'), adminController.approveDriver);
// router.get("/dashboard/stats", verifyToken, authorizeRoles('admin'), adminController.getDashboardStats);

// router.get('/trucks/available', 
//     verifyAdmin, 
//     authorizeRoles('admin'), 
//     adminController.getAvailableTrucks
//   );
//   router.get('/bookings/:bookingId/available-trucks',
//     verifyAdmin,
//     authorizeRoles('admin'),
//     adminController.getAvailableTrucksForBooking
//   );
  
module.exports = router;




