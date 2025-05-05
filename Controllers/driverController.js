const Truck = require("../Models/TruckBooking");
const User = require("../Models/userModel");

exports.registerTruck = async (req, res) => {
    try {
        const {
            truckOwnerName,
            ownerMobileNo,
            ownerDateOfBirth,
            ownerProvince,
            ownerAddress,
            ownerCountry,
            truckDriverName,
            driverMobileNo,
            driverDateOfBirth,
            driverProvince,
            driverAddress,
            driverCountry,
            driverCity,
            driverArea,
            typeOfTruck,
            weight,
            lisenceNo,
            truckColor
        } = req.body;

        // Check if user is approved driver
        if (!req.user.isApproved) {
            return res.status(403).json({ 
                message: "Your driver account is not yet approved by admin" 
            });
        }

        // Check if files are uploaded
        const idCardFrontImage = req.files?.idCardFrontImage?.[0]?.path;
        const idCardBackImage = req.files?.idCardBackImage?.[0]?.path;
        const licenseFrontImage = req.files?.licenseFrontImage?.[0]?.path;
        const profilePicture = req.files?.profilePicture?.[0]?.path;

        if (!idCardFrontImage || !idCardBackImage || !licenseFrontImage || !profilePicture) {
            return res.status(400).json({ message: "All images are required" });
        }

        // Create new truck
        const newTruck = new Truck({
            ownerDetails: {
                truckOwnerName,
                mobileNo: ownerMobileNo,
                dateOfBirth: ownerDateOfBirth,
                province: ownerProvince,
                address: ownerAddress,
                country: ownerCountry
            },
            driverDetails: {
                truckDriverName,
                mobileNo: driverMobileNo,
                dateOfBirth: driverDateOfBirth,
                province: driverProvince,
                address: driverAddress,
                country: driverCountry,
                city: driverCity,
                area: driverArea
            },
            idCardFrontImage,
            idCardBackImage,
            licenseFrontImage,
            profilePicture,
            truckDetails: {
                typeOfTruck,
                weight,
                lisenceNo,
                truckColor
            },
            userId: req.user._id,
            status: 'pending'
        });

        await newTruck.save();
        res.status(201).json({ 
            message: "Truck registration submitted for admin approval", 
            truck: newTruck 
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getMyTrucks = async (req, res) => {
    try {
        const trucks = await Truck.find({ userId: req.user._id });
        res.status(200).json({ success: true, data: trucks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};