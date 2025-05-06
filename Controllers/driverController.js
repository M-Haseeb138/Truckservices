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
            lisenceNo,
            typeOfTruck,
            weight,
            Registercity,
            VehicleNo
        } = req.body;

        // Check if user is an approved driver
        if (!req.user.isApproved) {
            return res.status(403).json({ 
                success: false,
                message: "Your driver account is not yet approved by admin" 
            });
        }

        // Check if all required images/files are uploaded
        const idCardFrontImage = req.files?.idCardFrontImage?.[0]?.path;
        const idCardBackImage = req.files?.idCardBackImage?.[0]?.path;
        const licenseFrontImage = req.files?.licenseFrontImage?.[0]?.path;
        const profilePicture = req.files?.profilePicture?.[0]?.path;
        const Truckdocument = req.files?.Truckdocument?.[0]?.path;

        if (!idCardFrontImage || !idCardBackImage || !licenseFrontImage || !profilePicture || !Truckdocument) {
            return res.status(400).json({ 
                success: false, 
                message: "All required images and documents must be uploaded" 
            });
        }

        // Create a new Truck document
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
                lisenceNo
            },
            idCardFrontImage,
            idCardBackImage,
            licenseFrontImage,
            profilePicture,
            truckDetails: {
                typeOfTruck,
                weight,
                Registercity,
                VehicleNo,
                Truckdocument
            },
            userId: req.user._id,
            status: 'pending'
        });

        await newTruck.save();

        res.status(201).json({ 
            success: true,
            message: "Truck registration submitted successfully for admin approval", 
            truck: newTruck 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: error.message 
        });
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