const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "TruckServices-assets", 
    allowed_formats: ["jpg", "jpeg", "png", "mp4", "mkv"], 
    resource_type: "auto",
  },
});
console.log("🚀 Cloudinary Storage Initialized");
const upload = multer({ storage });

module.exports = upload;

