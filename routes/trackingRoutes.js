const express = require('express');
const router = express.Router();
const  verifyToken  = require("../Middlewares/authMiddleware");
const verifyAdmin = require("../Middlewares/adminAuthMiddleware");
const trackingController = require("../Controllers/trackingController");
console.log("TrackingController:", trackingController);

router.get('/:bookingId/history', verifyToken, trackingController.getLocationHistory);
router.get('/bookingstatus/:bookingId',verifyAdmin, trackingController.getBookingStatus);

module.exports = router;