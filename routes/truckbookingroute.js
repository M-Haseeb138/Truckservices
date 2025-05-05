const express = require("express");
const router = express.Router();
const  truckBookingController = require("../Controllers/truckbookingController");
const verifyToken =require("../Middlewares/authMiddleware");

router.post("/booktruck",verifyToken,truckBookingController.bookTrucks);
router.get("/recentBookings", truckBookingController.getRecentBookings);

module.exports= router;
