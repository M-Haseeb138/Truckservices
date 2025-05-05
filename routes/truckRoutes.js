const express = require("express");
const router = express.Router();
const truckController = require("../Controllers/truckRegisterController");
const upload = require("../utils/multerConfig");
const verifyToken = require("../Middlewares/authMiddleware");

router.post("/register", verifyToken, upload.fields([
    { name: "idCardFrontImage", maxCount: 1 },
    { name: "idCardBackImage", maxCount: 1 },
    { name: "licenseFrontImage", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 }

]),
    truckController.registerTruck
);

router.get('/alltruck', verifyToken, truckController.getAllTrucks);
router.get("/gettruckbyid/:id", verifyToken, truckController.getTruckById);
router.delete('/deleteTruckByid/:id', verifyToken, truckController.deleteTruckByid);


module.exports = router;