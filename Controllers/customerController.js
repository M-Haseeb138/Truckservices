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

exports.cancelBooking = async (req, res) => {
    try {
      const { bookingId } = req.params;
  
      // 1. Find booking
      const booking = await TruckBooking.findOne({
        _id: bookingId,
        userId: req.user.userId
      });
  
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found or unauthorized"
        });
      }
  
      // 2. Check if cancellation is allowed
      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: "Only pending bookings can be cancelled"
        });
      }
  
      // 3. Update booking status
      booking.status = 'cancelled';
      await booking.save();
  
      // 4. If truck was assigned, mark it available again
      if (booking.truckId) {
        await TruckRegistration.findByIdAndUpdate(
          booking.truckId,
          { isAvailable: true }
        );
      }
  
      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        booking
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to cancel booking",
        error: error.message
      });
    }
  };
