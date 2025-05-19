const express = require("express");
const router = express.Router();
const driverController = require("../Controllers/driverController");
const verifyToken = require("../Middlewares/authMiddleware");
const {authorizeRoles} = require("../Middlewares/roleMiddleware");
const upload = require("../utils/multerConfig");

// Truck Registration
router.post("/trucks/register", 
    verifyToken, 
    authorizeRoles('driver'), 
    upload.fields([
        { name: 'idCardFrontImage', maxCount: 1 },
        { name: 'idCardBackImage', maxCount: 1 },
        { name: 'licenseFrontImage', maxCount: 1 },
        { name: 'profilePicture', maxCount: 1 },
        { name: 'Truckdocument', maxCount: 1 }
    ]), 
    driverController.registerTruck
);
router.get("/MyTrucks", verifyToken, authorizeRoles('driver'), driverController.getMyTrucks);
router.get("/getmyassignments", verifyToken, authorizeRoles('driver'), driverController.getDriverAssignments);
router.put("/assignments/status", verifyToken, authorizeRoles('driver'), driverController.updateAssignmentStatus);
router.put("/assignments/:bookingId", verifyToken, authorizeRoles('driver'), driverController.completeBooking);
module.exports = router;



