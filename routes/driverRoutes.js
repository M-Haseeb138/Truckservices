const express = require("express");
const router = express.Router();
const driverController = require("../Controllers/driverController");
const verifyToken = require("../Middlewares/authMiddleware");
const {authorizeRoles} = require("../Middlewares/roleMiddleware");
const upload = require("../utils/multerConfig");


router.post("/trucks/register", 
    verifyToken, 
    authorizeRoles('driver'), 
    upload.fields([
        { name: 'idCardFrontImage', maxCount: 1 },
        { name: 'idCardBackImage', maxCount: 1 },
        { name: 'licenseFrontImage', maxCount: 1 },
        { name: 'TruckPicture', maxCount: 1 },
        { name: 'Truckdocument', maxCount: 1 }
    ]), 
    driverController.registerTruck
);
router.get("/MyTrucks", verifyToken, authorizeRoles('driver'), driverController.getMyTrucks);
router.get("/getmyassignments", verifyToken, authorizeRoles('driver'), driverController.getDriverAssignments);
router.put("/assignments/status", verifyToken, authorizeRoles('driver'), driverController.updateAssignmentStatus);
router.put("/completebooking/:bookingId", verifyToken, authorizeRoles('driver'), driverController.completeBooking);
router.put("/updateLocation", verifyToken, authorizeRoles('driver'), driverController.updateLocation);
router.put("/startTrip", verifyToken, authorizeRoles('driver'), driverController.startTrip);
router.put("/updatedriverlocation", 
    verifyToken, 
    authorizeRoles('driver'), 
    driverController.updateDriverLocation
);
router.get("/nearbydriver", 
    verifyToken, 
    authorizeRoles('admin', 'customer'), 
    driverController.getNearbyDrivers
);
router.get("/getBookingStatusSummary",
    verifyToken,
    authorizeRoles('driver'),
    driverController.getDriverBookingStatusSummary
)
module.exports = router;




