const express = require('express');
const router = express.Router();
const  verifyToken  = require("../Middlewares/authMiddleware");
const trackingController = require("../Controllers/trackingController");
console.log("TrackingController:", trackingController);

// More specific route FIRST
router.get('/:bookingId/history', verifyToken, trackingController.getLocationHistory);

// More general route LAST
router.get('/:bookingId', verifyToken, trackingController.getTrackingData);

module.exports = router;