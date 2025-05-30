const express = require('express');
const router = express.Router();
const  verifyToken  = require("../Middlewares/authMiddleware");
const trackingController = require("../Controllers/trackingController");
console.log("TrackingController:", trackingController);

router.get('/:bookingId/history', verifyToken, trackingController.getLocationHistory);
router.get('/bookingstatus/:bookingId', verifyToken, trackingController.getBookingStatus);

module.exports = router;