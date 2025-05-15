// const Truck = require("../Models/TruckBooking");
// const User = require("../Models/userModel");
// const TruckRegistration = require("../Models/truckRegister");
// const TruckBooking = require("../Models/TruckBooking");


// exports.approveBooking = async (req, res) => {
//     try {
//         const { bookingId, truckId } = req.params;

//         const booking = await TruckBooking.findById(bookingId);
//         if (!booking) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Booking not found"
//             });
//         }

//         // Verify truck exists and matches booking requirements
//         const truck = await TruckRegistration.findOne({
//             _id: truckId,
//             status: 'approved',
//             isAvailable: true,
//             'truckDetails.typeOfTruck': { $in: booking.truckTypes },
//             'truckDetails.weight': booking.weight
//         });

//         if (!truck) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Selected truck doesn't meet requirements or is unavailable"
//             });
//         }

//         // Update records
//         await TruckRegistration.findByIdAndUpdate(truckId, { isAvailable: false });

//         booking.truckId = truckId;
//         booking.status = 'approved';
//         booking.approvedBy = req.admin.adminId;
//         booking.approvalDate = new Date();
//         await booking.save();

//         res.status(200).json({
//             success: true,
//             message: "Booking approved and truck assigned",
//             booking
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Server Error",
//             error: error.message
//         });
//     }
// };
// exports.approveTruck = async (req, res) => {
//     try {
//         const { truckId } = req.params;

//         const truck = await TruckRegistration.findById(truckId);
//         if (!truck) {
//             return res.status(404).json({ message: "Truck not found" });
//         }

//         // Approve the truck
//         truck.status = 'approved';
//         truck.approvedBy = req.admin.adminId;
//         truck.approvalDate = new Date();
//         await truck.save();


//         res.status(200).json({
//             message: "Truck approved successfully",
//             truck
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };
// exports.getPendingTrucks = async (req, res) => {
//     try {
//         const trucks = await TruckRegistration.find({ status: 'pending' }).populate('userId');
//         res.status(200).json({ success: true, data: trucks });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server Error", error: error.message });
//     }
// };
// exports.getPendingBookings = async (req, res) => {
//     try {
//         const bookings = await TruckBooking.find({ status: 'pending' })
//             .populate('userId', 'fullName phone')
//             .sort({ createdAt: -1 });

//         res.status(200).json({
//             success: true,
//             data: bookings
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to get pending bookings",
//             error: error.message
//         });
//     }
// };
// exports.rejectTruck = async (req, res) => {
//     try {
//         const { truckId } = req.params;

//         const rejectedTruck = await TruckRegistration.findByIdAndUpdate(
//             truckId,
//             {
//                 status: 'rejected',
//                 isAvailable: false, // <-- Important
//                 rejectionDate: new Date()
//             },
//             { new: true }
//         ).populate('userId');

//         if (!rejectedTruck) {
//             return res.status(404).json({ success: false, message: "Truck not found" });
//         }

//         res.status(200).json({ success: true, data: rejectedTruck });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server Error", error: error.message });
//     }
// };
// exports.getRejectedTrucks = async (req, res) => {
//     try {
//         const trucks = await TruckRegistration.find({ status: 'rejected' }).populate('userId');
//         res.status(200).json({ success: true, data: trucks });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server Error", error: error.message });
//     }
// };
// exports.getApprovedTrucks = async (req, res) => {
//     try {
//         const approvedTrucks = await TruckRegistration.find({ status: 'approved' }).populate('userId');

//         res.status(200).json({
//             success: true,
//             count: approvedTrucks.length,
//             trucks: approvedTrucks
//         });
//     } catch (error) {
//         console.error("Error fetching approved trucks:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch approved trucks",
//             error: error.message
//         });
//     }
// };
// exports.getApprovedDrivers = async (req, res) => {
//     try {
//         // 1. Find all approved trucks, along with user details
//         const approvedTrucks = await TruckRegistration.find({ status: 'approved' })
//             .populate('userId', 'fullName phone email CNIC role');

//         // 2. Create a map to group trucks by driver
//         const driverMap = new Map();

//         approvedTrucks.forEach(truck => {
//             const driverId = truck.userId._id.toString();

//             // Initialize driver if not already added
//             if (!driverMap.has(driverId)) {
//                 driverMap.set(driverId, {
//                     _id: truck.userId._id,
//                     fullName: truck.userId.fullName,
//                     phone: truck.userId.phone,
//                     email: truck.userId.email,
//                     CNIC: truck.userId.CNIC,
//                     role: truck.userId.role,
//                     trucks: [] // Will hold all their approved trucks
//                 });
//             }

//             // Add current truck details to the driver's truck list
//             driverMap.get(driverId).trucks.push({
//                 _id: truck._id,
//                 driverDetails: truck.driverDetails,
//                 ownerDetails: truck.ownerDetails,
//                 truckDetails: truck.truckDetails,
//                 idCardFrontImage: truck.idCardFrontImage,
//                 idCardBackImage: truck.idCardBackImage,
//                 licenseFrontImage: truck.licenseFrontImage,
//                 profilePicture: truck.profilePicture,
//                 Truckdocument: truck.truckDetails.Truckdocument,
//                 registrationDate: truck.createdAt,
//                 status: truck.status
//             });
//         });

//         // 3. Convert map values to array
//         const drivers = Array.from(driverMap.values());

//         res.status(200).json({
//             success: true,
//             count: drivers.length,
//             drivers
//         });

//     } catch (error) {
//         console.error("Error fetching approved drivers:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch approved drivers",
//             error: error.message
//         });
//     }
// };
// exports.getRegisteredCustomers = async (req, res) => {
//     try {
//         const customer = await User.find({ role: 'customer' })
//             .select('-password')
//             .sort({ createdAt: -1 });
//         res.status(200).json(
//             {
//                 success: true,
//                 count: customer.length,
//                 customer
//             }
//         )
//     } catch (error) {
//         console.error("error Fetching customer", error);
//         res.status(500).json({
//             sucess: false,
//             message: "Failed to fetch customer",
//             error: error.message
//         });

//     }
// }
// exports.getMatchingDriversForBooking = async (req, res) => {
//     try {
//         const { bookingId } = req.params;

//         // 1. Get the booking details
//         const booking = await TruckBooking.findById(bookingId);
//         if (!booking) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Booking not found"
//             });
//         }

//         // 2. Find all approved trucks that match the booking requirements and are available
//         const matchingTrucks = await TruckRegistration.find({
//             status: 'approved',
//             isAvailable: true,
//             'truckDetails.typeOfTruck': { $in: booking.truckTypes },
//             'truckDetails.weight': booking.weight
//         }).populate('userId', 'fullName phone email');

//         // 3. If no matches found, explain why
//         if (matchingTrucks.length === 0) {
//             // Find why no matches - check availability first
//             const unavailableTrucks = await TruckRegistration.find({
//                 'truckDetails.typeOfTruck': { $in: booking.truckTypes },
//                 'truckDetails.weight': booking.weight,
//                 status: 'approved',
//                 isAvailable: false
//             }).countDocuments();

//             // Check if any trucks match type but not weight
//             const wrongWeightTrucks = await TruckRegistration.find({
//                 'truckDetails.typeOfTruck': { $in: booking.truckTypes },
//                 'truckDetails.weight': { $ne: booking.weight },
//                 status: 'approved'
//             }).countDocuments();

//             // Check if any trucks match weight but not type
//             const wrongTypeTrucks = await TruckRegistration.find({
//                 'truckDetails.typeOfTruck': { $nin: booking.truckTypes },
//                 'truckDetails.weight': booking.weight,
//                 status: 'approved'
//             }).countDocuments();

//             return res.status(200).json({
//                 success: true,
//                 count: 0,
//                 bookingRequirements: {
//                     truckTypes: booking.truckTypes,
//                     weight: booking.weight,
//                     materials: booking.materials
//                 },
//                 availableDrivers: [],
//                 noMatchesReason: {
//                     message: "No available trucks match all requirements",
//                     unavailableButMatching: unavailableTrucks,
//                     matchingTypeWrongWeight: wrongWeightTrucks,
//                     matchingWeightWrongType: wrongTypeTrucks,
//                     totalApprovedTrucks: await TruckRegistration.countDocuments({ status: 'approved' })
//                 }
//             });
//         }

//         // 4. Group trucks by driver
//         const driverMap = new Map();

//         matchingTrucks.forEach(truck => {
//             const driverId = truck.userId._id.toString();

//             if (!driverMap.has(driverId)) {
//                 driverMap.set(driverId, {
//                     _id: truck.userId._id,
//                     fullName: truck.userId.fullName,
//                     phone: truck.userId.phone,
//                     email: truck.userId.email,
//                     trucks: []
//                 });
//             }

//             driverMap.get(driverId).trucks.push({
//                 truckId: truck._id,
//                 typeOfTruck: truck.truckDetails.typeOfTruck,
//                 weight: truck.truckDetails.weight,
//                 vehicleNo: truck.truckDetails.VehicleNo,
//                 city: truck.truckDetails.Registercity
//             });
//         });

//         const availableDrivers = Array.from(driverMap.values());

//         res.status(200).json({
//             success: true,
//             count: availableDrivers.length,
//             bookingRequirements: {
//                 truckTypes: booking.truckTypes,
//                 weight: booking.weight,
//                 materials: booking.materials
//             },
//             availableDrivers
//         });

//     } catch (error) {
//         console.error("Error finding matching drivers:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to find matching drivers",
//             error: error.message
//         });
//     }
// };
// exports.assignDriverToBooking = async (req, res) => {
//     try {
//         const { bookingId, driverId, truckId } = req.body;

//         // 1. Validate all required fields
//         if (!bookingId || !driverId || !truckId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Booking ID, Driver ID and Truck ID are required"
//             });
//         }

//         // 2. Find and validate the booking
//         const booking = await TruckBooking.findById(bookingId);
//         if (!booking) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Booking not found"
//             });
//         }
//         if (booking.status !== 'pending') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Only pending bookings can be assigned"
//             });
//         }

//         // 3. Find and validate the truck
//         const truck = await TruckRegistration.findOne({
//             _id: truckId,
//             userId: driverId,
//             status: 'approved',
//             isAvailable: true
//         });

//         if (!truck) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Truck not found or not available"
//             });
//         }

//         // 4. Check if truck matches booking requirements
//         if (!booking.truckTypes.includes(truck.truckDetails.typeOfTruck) || 
//             booking.weight !== truck.truckDetails.weight) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Selected truck doesn't match booking requirements"
//             });
//         }

//         // 5. Update the booking and truck status
//         booking.assignedDriverId = driverId;
//         booking.truckId = truckId;
//         booking.status = 'assigned';
//         booking.approvedBy = req.admin.adminId;
//         booking.approvalDate = new Date();

//         truck.isAvailable = false;

//         // 6. Save changes in a transaction
//         await Promise.all([
//             booking.save(),
//             truck.save()
//         ]);

//         res.status(200).json({
//             success: true,
//             message: "Driver assigned successfully",
//             booking: {
//                 _id: booking._id,
//                 trackingId: booking.trackingId,
//                 assignedDriverId: booking.assignedDriverId,
//                 truckId: booking.truckId,
//                 status: booking.status,
//                 from: booking.from,
//                 to: booking.to,
//                 scheduledDate: booking.scheduledDate
//             }
//         });

//     } catch (error) {
//         console.error("Error assigning driver:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to assign driver",
//             error: error.message
//         });
//     }
// };




/////////////////////////
// exports.getDashboardStats = async (req, res) => {
//     try {
//         const stats = {
//             pending: await TruckBooking.countDocuments({ status: 'pending' }),
//             assigned: await TruckBooking.countDocuments({ status: 'assigned' }),
//             inProgress: await TruckBooking.countDocuments({ status: 'in-progress' }),
//             completed: await TruckBooking.countDocuments({ status: 'completed' }),
//             drivers: await User.countDocuments({ role: 'driver', isApproved: true })
//         };

//         res.status(200).json({
//             success: true,
//             data: stats
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to get dashboard stats",
//             error: error.message
//         });
//     }
// };

