exports.getRegisteredCustomers = async (req, res) => {
    try {
        // Find all users with role 'customer'
        const customers = await User.find({ role: 'customer' })
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
            error: error.message
        });
    }
};