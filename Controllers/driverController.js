const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");

// exports.registerTruck = async (req, res) => {
//     try {
//         console.log("Incoming request user:", req.user); // Debug log

//         // 1. Verify user exists in request (from middleware)
//         if (!req.user || !req.user.userId) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Authentication required"
//             });
//         }

//         // 2. Check driver approval status (using middleware-provided data)
//         if (!req.user.isApproved) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Driver account pending admin approval"
//             });
//         }

//         // 3. Validate required files
//         const requiredFiles = [
//             'idCardFrontImage',
//             'idCardBackImage',
//             'licenseFrontImage',
//             'profilePicture',
//             'Truckdocument'
//         ];

//         const missingFiles = requiredFiles.filter(
//             file => !req.files?.[file]?.[0]?.path
//         );

//         if (missingFiles.length > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Missing required files: ${missingFiles.join(', ')}`
//             });
//         }

//         // 4. Create new truck (using req.user.userId)
//         const newTruck = new TruckRegistration({
//             ownerDetails: {
//                 truckOwnerName: req.body.truckOwnerName,
//                 mobileNo: req.body.ownerMobileNo,
//                 dateOfBirth: req.body.ownerDateOfBirth,
//                 province: req.body.ownerProvince,
//                 address: req.body.ownerAddress,
//                 country: req.body.ownerCountry
//             },
//             driverDetails: {
//                 truckDriverName: req.body.truckDriverName,
//                 mobileNo: req.body.driverMobileNo,
//                 dateOfBirth: req.body.driverDateOfBirth,
//                 province: req.body.driverProvince,
//                 address: req.body.driverAddress,
//                 country: req.body.driverCountry,
//                 city: req.body.driverCity,
//                 lisenceNo: req.body.lisenceNo
//             },
//             idCardFrontImage: req.files.idCardFrontImage[0].path,
//             idCardBackImage: req.files.idCardBackImage[0].path,
//             licenseFrontImage: req.files.licenseFrontImage[0].path,
//             profilePicture: req.files.profilePicture[0].path,
//             truckDetails: {
//                 typeOfTruck: req.body.typeOfTruck,
//                 weight: req.body.weight,
//                 Registercity: req.body.Registercity,
//                 VehicleNo: req.body.VehicleNo,
//                 Truckdocument: req.files.Truckdocument[0].path
//             },
//             userId: req.user.userId, // Using the userId from middleware
//             status: 'pending'
//         });

//         const savedTruck = await newTruck.save();
//         console.log("Truck saved successfully:", savedTruck);

//         res.status(201).json({
//             success: true,
//             message: "Truck registration submitted for approval",
//             truck: savedTruck
//         });

//     } catch (error) {
//         console.error("Registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Registration failed",
//             error: error.message
//         });
//     }
// };


exports.getMyTrucks = async (req, res) => {
    try {
        console.log("Current user ID:", req.user.userId); // ✅ Use userId
        console.log("User ID type:", typeof req.user.userId);

        const trucks = await TruckRegistration.find({ userId: req.user.userId });  // ✅ Correct field
        console.log("Found trucks:", trucks);

        res.status(200).json({ success: true, data: trucks });
    } catch (error) {
        console.error("Error fetching trucks:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getMyAssignments = async (req, res) => {
    try {
        const assignments = await TruckBooking.find({
            assignedDriverId: req.user.userId,
            status: { $in: ['assigned', 'in-progress'] }
        })
            .populate('userId', 'fullName phone')
            .sort({ scheduledDate: 1 });

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get assignments",
            error: error.message
        });
    }
};

exports.updateAssignmentStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        // Validate booking exists and belongs to this driver
        const booking = await TruckBooking.findOne({
            _id: bookingId,
            assignedDriverId: req.user.userId
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        // Validate status transition
        const validTransitions = {
            'assigned': 'in-progress',
            'in-progress': 'completed'
        };

        if (!validTransitions[booking.status] || validTransitions[booking.status] !== status) {
            return res.status(400).json({
                success: false,
                message: "Invalid status transition"
            });
        }

        // Update truck availability when job is completed
        if (status === 'completed' && booking.truckId) {
            await TruckRegistration.findByIdAndUpdate(
                booking.truckId,
                { isAvailable: true }
            );
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Status updated successfully",
            booking
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Update failed",
            error: error.message
        });
    }
};

exports.registerTruck = async (req, res) => {
    try {
     
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 3. Validate required files
        const requiredFiles = [
            'idCardFrontImage',
            'idCardBackImage',
            'licenseFrontImage',
            'profilePicture',
            'Truckdocument'
        ];

        const missingFiles = requiredFiles.filter(
            file => !req.files?.[file]?.[0]?.path
        );

        if (missingFiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required files: ${missingFiles.join(', ')}`
            });
        }

        // 4. Driver details (truckDriverName and driver mobile always from user)
        const driverDetails = {
            truckDriverName: user.fullName,  // Always from user
            mobileNo: user.phone,            // Always from user
            email: user.email,               // Always from user
            CNIC: user.CNIC,                 // Always from user
            dateOfBirth: req.body.driverDateOfBirth,
            province: req.body.driverProvince,
            address: req.body.driverAddress,
            country: req.body.driverCountry,
            city: req.body.driverCity || '',
            lisenceNo: req.body.lisenceNo || ''
        };

        // 5. Owner details (entered manually)
        const ownerDetails = {
            truckOwnerName: req.body.truckOwnerName,
            mobileNo: req.body.ownerMobileNo,
            dateOfBirth: req.body.ownerDateOfBirth,
            province: req.body.ownerProvince,
            address: req.body.ownerAddress,
            country: req.body.ownerCountry
        };

        // 6. Validate mandatory driver fields
        if (!driverDetails.dateOfBirth || !driverDetails.province || !driverDetails.address || !driverDetails.country) {
            return res.status(400).json({
                success: false,
                message: "Driver's province, country, address, and date of birth are required"
            });
        }

        // 7. Validate mandatory owner fields
        if (!ownerDetails.truckOwnerName || !ownerDetails.mobileNo || !ownerDetails.dateOfBirth || !ownerDetails.province || !ownerDetails.address || !ownerDetails.country) {
            return res.status(400).json({
                success: false,
                message: "Owner name, mobile, DOB, province, address, and country are required"
            });
        }

        // 8. Build Truck object
        const newTruck = new TruckRegistration({
            ownerDetails,
            driverDetails,
            idCardFrontImage: req.files.idCardFrontImage[0].path,
            idCardBackImage: req.files.idCardBackImage[0].path,
            licenseFrontImage: req.files.licenseFrontImage[0].path,
            profilePicture: req.files.profilePicture[0].path,
            truckDetails: {
                typeOfTruck: req.body.typeOfTruck,
                weight: req.body.weight,
                Registercity: req.body.Registercity,
                VehicleNo: req.body.VehicleNo,
                Truckdocument: req.files.Truckdocument[0].path
            },
            userId: req.user.userId,
            status: 'pending'
        });

        // 9. Save to database
        const savedTruck = await newTruck.save();

        // 10. Return success response
        res.status(201).json({
            success: true,
            message: "Truck registration submitted for approval",
            truck: {
                _id: savedTruck._id,
                ownerDetails: savedTruck.ownerDetails,
                driverDetails: savedTruck.driverDetails,
                truckDetails: savedTruck.truckDetails,
                status: savedTruck.status,
                createdAt: savedTruck.createdAt
            }
        });

    } catch (error) {
        console.error("Truck registration error:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Truck registration failed",
            error: error.message
        });
    }
};


