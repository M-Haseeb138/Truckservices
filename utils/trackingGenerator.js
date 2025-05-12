// utils/trackingGenerator.js
const TruckBooking = require("../Models/TruckBooking");

const generateTrackingId = () => {
    const min = 100000; // Smallest 6-digit number
    const max = 999999; // Largest 6-digit number
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

const isTrackingIdUnique = async (trackingId) => {
    const existingBooking = await TruckBooking.findOne({ trackingId });
    return !existingBooking;
};

exports.generateUniqueTrackingId = async () => {
    let trackingId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        trackingId = generateTrackingId();
        isUnique = await isTrackingIdUnique(trackingId);
        attempts++;
    }

    if (!isUnique) {
        throw new Error("Failed to generate unique tracking ID");
    }

    return trackingId;
};