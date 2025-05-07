

here is my all code view it and tell me the foow and also check all is correct also explian me the working of all apis
truckbooking model
const mongoose = require("mongoose");

const truckBookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  assignedDriverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  from: { 
    type: String, 
    required: true 
  },
  to: { 
    type: String, 
    required: true 
  },
  materials: [{
    type: String,
    enum: [
      "Auto Parts",
      "Bardana jute or plastic",
      "Building Materials",
      "Cement",
      "Chemicals",
      "Coal And Ash",
      "Container",
      "Cotton seed",
      "Electronics Consumer Durables",
      "Fertilizers",
      "Fruits And Vegetables",
      "Furniture And Wood Products",
      "House Hold Goods",
      "Industrial Equipments",
      "Iron sheets or bars or scraps",
      "Liquids in drums",
      "Liquids/Oil",
      "Machinery new or old",
      "Medicals",
      "Metals",
      "Mill Jute Oil",
      "Others",
      "Packed Food",
      "Plastic Pipes or other products",
      "powder bags",
      "Printed books or Paper rolls",
      "Refrigerated Goods",
      "Rice or wheat or Agriculture Products",
      "Scrap",
      "Spices",
      "Textiles",
      "Tyres And Rubber Products",
      "Vehicles or car"
    ],
    required: true
  }],
  weight: {
    type: String,
    enum: [
      "Above 30 MT",
      "Do Not Know",
      "Upto 12 MT",
      "Upto 15 MT",
      "Upto 20 MT",
      "Upto 25 MT",
      "Upto 28 MT",
      "Upto 5 MT",
      "Upto 7 MT",
      "Upto 9 MT"
    ],
    required: true
  },
  truckTypes: [{
    type: String,
    enum: [
      "Shahzor-9Ft Open",
      "Mazda- 12/14 Ft",
      "Mazda-16/17/18 Ft Open",
      "Mazda-19/20Ft Open",
      "Mazda Flat Bed-25 x 8 (LHR only)",
      "Mazda-14/16(Containerized)",
      "Mazda-17Ft (Containerized)",
      "Flat Bed-20Ft (6 Wheeler)",
      "Flat Bed-40Ft (14 Wheeler)",
      "Boom Truck-16Ft",
      "20Ft Container-Standard",
      "40Ft Container- Standard",
      "22 Wheeler (Half Body)",
      "Mazda - 12Ton",
      "10 Wheeler Open Body",
      "Flat Bed-40Ft (18 Wheeler)",
      "Flat Bed-40Ft (22 Wheeler)",
      "Low Bed- 25Ft (10 wheeler)",
      "Single Hino (6 Wheeler) [6 Natti]",
      "Mazda-20Ft (Containerized)",
      "Mazda-22Ft (Containerized)",
      "40Ft HC Container",
      "Low Bed- 40Ft (22 wheeler)",
      "Mazda - 32Ft Container (Punjab&KPK)",
      "Shahzor- 9ft Container",
      "Ravi Pick Up (Open)",
      "Dumper - 10 Wheeler",
      "40Ft single Trailer",
      "40Ft - Double 20 Trailer",
      "20Ft Single Truck",
      "Low Bed- 30Ft (10 wheeler)",
      "17Ft Mazda Container",
      "24Ft Mazda Container",
      "Mazda 16/18Ft Tow Truck",
      "Mazda 26Ft Container",
      "Crane -25 Ton",
      "50ft HC Container",
      "45ft HC Container",
      "20Ft Reefer Container"
    ],
    required: true
  }],
  noOfTrucks: { 
    type: Number, 
    required: true 
  },
  scheduledDate: { 
    type: Date, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  customerName: { 
    type: String 
  },
  customerPhone: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model("TruckBooking", truckBookingSchema);

truckregister model
const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema({
    ownerDetails: {
        truckOwnerName: { type: String, required: true },
        mobileNo: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        province: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true }
    },
    driverDetails: {
        truckDriverName: { type: String, required: true },
        mobileNo: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        province: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true },
        city: { type: String, required: true },
        lisenceNo:{type:String,required:true}
    },
    idCardFrontImage: { type: String, required: true },
    idCardBackImage: { type: String, required: true },
    licenseFrontImage: { type: String, required: true },
    profilePicture: { type: String, required: true },
    truckDetails: {
        typeOfTruck: { type: String, required: true },
        weight: { type: String, required: true },
        Registercity: { type: String, required: true },
        VehicleNo: { type: String, required: true },
        Truckdocument:{type:String,require:true}
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    approvedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },
    approvalDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TruckRegistration ', truckSchema);

userModel
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: false,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{11}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    image: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ['admin', 'driver', 'customer'],
        default: 'customer',
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);

adminController
const Truck = require("../Models/TruckBooking");
const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");

exports.approveTruck = async (req, res) => {
    try {
        const { truckId } = req.params;

        const truck = await TruckRegistration.findById(truckId);
        if (!truck) {
            return res.status(404).json({ message: "Truck not found" });
        }

        // Approve the truck
        truck.status = 'approved';
        truck.approvedBy = req.user._id;
        truck.approvalDate = new Date();
        await truck.save();

        // Approve the driver if not already approved
        const driver = await User.findById(truck.userId);
        if (driver && !driver.isApproved) {
            driver.isApproved = true;
            await driver.save();
        }

        res.status(200).json({ 
            message: "Truck approved successfully", 
            truck 
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getPendingTrucks = async (req, res) => {
    try {
        const trucks = await TruckRegistration.find({ status: 'pending' }).populate('userId');
        res.status(200).json({ success: true, data: trucks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' }).select('-password');
        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getPendingBookings = async (req, res) => {
    try {
        const bookings = await TruckBooking.find({ status: 'pending' })
            .populate('userId', 'fullName phone')
            .populate('truckId')
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            data: bookings 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to get pending bookings",
            error: error.message 
        });
    }
};

exports.approveBooking = async (req, res) => {
    try {
        const { bookingId, truckId } = req.params;

        const booking = await TruckBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ 
                success: false,
                message: "Booking not found" 
            });
        }

        // Verify truck is available
        const truck = await Truck.findById(truckId);
        if (!truck || truck.status !== 'approved') {
            return res.status(400).json({ 
                success: false,
                message: "Selected truck is not available" 
            });
        }

        // Update booking
        booking.truckId = truckId;
        booking.status = 'confirmed';
        booking.approvedBy = req.user._id;
        booking.approvalDate = new Date();
        
        await booking.save();

        res.status(200).json({ 
            success: true,
            message: "Booking approved and truck assigned", 
            booking 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


exports.getPendingDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ 
            role: 'driver', 
            isApproved: false 
        }).select('-password');
        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.approveDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driver = await User.findByIdAndUpdate(
            driverId,
            { isApproved: true },
            { new: true }
        );
        res.status(200).json({ success: true, message: "Driver approved", driver });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getAvailableDrivers = async (req, res) => {
    try {
        // Find drivers who don't have active assignments
        const drivers = await User.find({ 
            role: 'driver',
            isApproved: true
        }).select('fullName phone');

        res.status(200).json({ 
            success: true, 
            data: drivers 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to get available drivers",
            error: error.message 
        });
    }
};

exports.assignDriver = async (req, res) => {
    try {
        const { bookingId, driverId } = req.body;

        // Validate booking exists
        const booking = await TruckBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ 
                success: false,
                message: "Booking not found" 
            });
        }

        // Validate driver exists and is approved
        const driver = await User.findOne({
            _id: driverId,
            role: 'driver',
            isApproved: true
        });
        if (!driver) {
            return res.status(400).json({ 
                success: false,
                message: "Driver not available" 
            });
        }

        // Assign driver
        booking.assignedDriverId = driverId;
        booking.status = 'assigned';
        await booking.save();

        res.status(200).json({ 
            success: true,
            message: "Driver assigned successfully", 
            booking 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Assignment failed",
            error: error.message 
        });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = {
            pending: await TruckBooking.countDocuments({ status: 'pending' }),
            assigned: await TruckBooking.countDocuments({ status: 'assigned' }),
            inProgress: await TruckBooking.countDocuments({ status: 'in-progress' }),
            completed: await TruckBooking.countDocuments({ status: 'completed' }),
            drivers: await User.countDocuments({ role: 'driver', isApproved: true })
        };

        res.status(200).json({ 
            success: true, 
            data: stats 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to get dashboard stats",
            error: error.message 
        });
    }
};
customerController
// In all controllers, use:
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");
const User = require("../Models/userModel");

exports.bookTruck = async (req, res) => {
    try {
        const {
            from,
            to,
            materials,
            weight,
            truckTypes,
            noOfTrucks,
            scheduledDate
        } = req.body;

        // Get customer details from user model
        const customer = await User.findById(req.user.userId);
        if (!customer) {
            return res.status(404).json({ 
                success: false,
                message: "Customer not found" 
            });
        }

        // Validate date
        if (new Date(scheduledDate) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Scheduled date must be in the future"
            });
        }

        // Create booking
        const newBooking = new TruckBooking({
            userId: req.user.userId,
            from,
            to,
            materials,
            weight,
            truckTypes,
            noOfTrucks,
            scheduledDate,
            customerName: customer.fullName,
            customerPhone: customer.phone,
            status: 'pending'
        });

        await newBooking.save();

        res.status(201).json({ 
            success: true, 
            message: "Truck booking request submitted successfully", 
            booking: newBooking 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Booking failed",
            error: error.message 
        });
    }
};

exports.getMyBookings = async(req,res)=>{

    try {
        const bookings = await TruckBooking.find({userId:req.user.userId})
        .sort({createdAt : -1})
        .populate('assignedDriverId', 'fullName phone');
        res.status(200).json({
            sucess:true,
            data : bookings
        });
    } catch (error) {
        res.status(500).json({
            sucess:false,
            message:"Failed to get bookings",
            error:error.message
        })
    }
}

DriverCOntroller
const User = require("../Models/userModel");
const TruckRegistration = require("../Models/truckRegister");
const TruckBooking = require("../Models/TruckBooking");

exports.registerTruck = async (req, res) => {
    try {
        console.log("Incoming request user:", req.user); // Debug log

        // 1. Verify user exists in request (from middleware)
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // 2. Check driver approval status (using middleware-provided data)
        if (!req.user.isApproved) {
            return res.status(403).json({ 
                success: false,
                message: "Driver account pending admin approval" 
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

        // 4. Create new truck (using req.user.userId)
        const newTruck = new TruckRegistration({
            ownerDetails: {
                truckOwnerName: req.body.truckOwnerName,
                mobileNo: req.body.ownerMobileNo,
                dateOfBirth: req.body.ownerDateOfBirth,
                province: req.body.ownerProvince,
                address: req.body.ownerAddress,
                country: req.body.ownerCountry
            },
            driverDetails: {
                truckDriverName: req.body.truckDriverName,
                mobileNo: req.body.driverMobileNo,
                dateOfBirth: req.body.driverDateOfBirth,
                province: req.body.driverProvince,
                address: req.body.driverAddress,
                country: req.body.driverCountry,
                city: req.body.driverCity,
                lisenceNo: req.body.lisenceNo
            },
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
            userId: req.user.userId, // Using the userId from middleware
            status: 'pending'
        });

        const savedTruck = await newTruck.save();
        console.log("Truck saved successfully:", savedTruck);

        res.status(201).json({ 
            success: true,
            message: "Truck registration submitted for approval", 
            truck: savedTruck
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            success: false,
            message: "Registration failed",
            error: error.message 
        });
    }
};

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

adminRoutes
const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/adminController");
const verifyToken = require("../Middlewares/authMiddleware");
const { authorizeRoles } = require("../Middlewares/roleMiddleware");

// Truck Approval
router.get("/trucks/pending", verifyToken, authorizeRoles('admin'), adminController.getPendingTrucks);
router.post("/trucks/approve/:truckId", verifyToken, authorizeRoles('admin'), adminController.approveTruck);

// Driver Management
router.get("/getalldrivers", verifyToken, authorizeRoles('admin'), adminController.getAllDrivers);
router.get("/drivers/available", verifyToken, authorizeRoles('admin'), adminController.getAvailableDrivers);
router.get("/bookings/pending", verifyToken, authorizeRoles('admin'), adminController.getPendingBookings);
router.post("/bookings/approve/:bookingId/:truckId", verifyToken, authorizeRoles('admin'), adminController.approveBooking);
router.post("/bookings/assign", verifyToken, authorizeRoles('admin'), adminController.assignDriver);
router.get('/drivers/pending', verifyToken, authorizeRoles('admin'), adminController.getPendingDrivers);
router.put('/drivers/approve/:driverId', verifyToken, authorizeRoles('admin'), adminController.approveDriver);
router.get("/dashboard/stats", verifyToken, authorizeRoles('admin'), adminController.getDashboardStats);

module.exports = router;

customerRoutes
const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/customerController");
const verifyToken = require("../Middlewares/authMiddleware");
const {authorizeRoles} = require("../Middlewares/roleMiddleware");

// Truck Booking
router.post("/TruckBooking", verifyToken, authorizeRoles('customer'), customerController.bookTruck);
router.get("/bookings/my", verifyToken, authorizeRoles('customer'), customerController.getMyBookings);


module.exports = router;
DriverRoutes
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
router.get("/getmyassignments", verifyToken, authorizeRoles('driver'), driverController.getMyAssignments);
router.put("/assignments/status", verifyToken, authorizeRoles('driver'), driverController.updateAssignmentStatus);
module.exports = router;