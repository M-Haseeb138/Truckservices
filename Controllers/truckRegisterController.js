// const Truck = require("../Models/truckRegister");

// exports.registerTruck = async (req, res) => {
//     try {
//         const {
//             truckOwnerName,
//             ownerMobileNo,
//             ownerDateOfBirth,
//             ownerProvince,
//             ownerAddress,
//             ownerCountry,
//             truckDriverName,
//             driverMobileNo,
//             driverDateOfBirth,
//             driverProvince,
//             driverAddress,
//             driverCountry,
//             driverCity,
//             driverArea,
//             typeOfTruck,
//             weight,
//             lisenceNo,
//             truckColor
//         } = req.body;

//         const idCardFrontImage = req.files?.idCardFrontImage?.[0]?.path;
//         const idCardBackImage = req.files?.idCardBackImage?.[0]?.path;
//         const licenseFrontImage = req.files?.licenseFrontImage?.[0]?.path;
//         const profilePicture = req.files?.profilePicture?.[0]?.path;

//         if (!idCardFrontImage || !idCardBackImage || !licenseFrontImage || !profilePicture) {
//             return res.status(400).json({ message: "All images are required" });
//         }

//         const newTruck = new Truck({
//             ownerDetails: {
//                 truckOwnerName,
//                 mobileNo: ownerMobileNo,
//                 dateOfBirth: ownerDateOfBirth,
//                 province: ownerProvince,
//                 address: ownerAddress,
//                 country: ownerCountry
//             },
//             driverDetails: {
//                 truckDriverName,
//                 mobileNo: driverMobileNo,
//                 dateOfBirth: driverDateOfBirth,
//                 province: driverProvince,
//                 address: driverAddress,
//                 country: driverCountry,
//                 city: driverCity,
//                 area: driverArea
//             },
//             idCardFrontImage,
//             idCardBackImage,
//             licenseFrontImage,
//             profilePicture,
//             truckDetails: {
//                 typeOfTruck,
//                 weight,
//                 lisenceNo,
//                 truckColor
//             },
//             userId: req.user.userId
//         });

//         await newTruck.save();
//         res.status(201).json({ message: "Truck Registered Successfully", truck: newTruck });

//     } catch (error) {
//         console.error("Error Registering Truck:", error.message);
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };


// exports.getAllTrucks = async (req, res) => {
//     try {

//         const truck = await Truck.find().populate('userId');
//         res.status(200).json({ sucess: true, data: truck });

//     } catch (error) {
//         res.status(500).json({ sucess: false, message: "server Error", error: error.message });
//     }
// }

// exports.getTruckById = async (req, res) => {
//     try {

//         const truck = await Truck.findById(req.params.id).populate('userId');
//         if (!truck) {
//             res.status(404).json({ sucess: false, message: "Truck not found" });
//         }
//         res.status(200).json({ sucess: true, data: truck });
//     } catch (error) {
//         res.status(500).json({ sucess: false, message: "server Error", error: error.message });
//     }
// }

// exports.deleteTruckByid = async (req, res) => {
//     try {
//         const truck = await Truck.findByIdAndDelete(req.params.id);
//         if (!truck) {
//             res.status(404).json({ sucess: false, message: "Truck not found " })
//         }
//         res.status(200).json({ sucess: true, message: "Truck deleted sucessfully" })
//     } catch (error) {
//         res.status(500).json({ sucess: false, message: "Server Error", error: error.message });
//     }
// };
