const TruckBooking = require("../Models/TruckBooking");

exports.bookTrucks = async (req, res) => {
    try {

        const {
            truckSize,
            loadType,
            fromCity,
            fromArea,
            toCity,
            toArea,
            material,
            weightMt,
            truckType,
            noOfTrucks,
            scheduledDate

        } = req.body;

        const newBooking = new TruckBooking({
            userId: req.user.userId,
            truckSize,
            loadType,
            from: { city: fromCity, area: fromArea },
            to: { city: toCity, area: toArea },
            material,
            weightMt,
            truckType,
            noOfTrucks,
            scheduledDate
        })
        await newBooking.save();
        res.status(201).json({ sucess: true, message: "turck booked sucessfully", booking: newBooking })

    } catch (error) {
        res.status(500).json({ sucess: false, message: "server error", error: error.message });
    }
}

exports.getRecentBookings = async (req, res) => {
    try {
        const bookings = await TruckBooking.find({})
            .sort({ createdAt: -1 }) // Newest first
            .limit(10); // Adjust as needed

        const formatted = bookings.map(booking => ({
            fromCity: booking.from.city,
            toCity: booking.to.city,
            distance: "1,143 Km", // You can later calculate dynamically
            weight: `${booking.weightMt} mt`,
            date: new Date(booking.scheduledDate).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            }),
            material: booking.material,
            truckType: booking.truckType,
            postedBy: "Transporter" 
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
