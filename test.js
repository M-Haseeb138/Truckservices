// Get all active customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await User.find({ 
            role: 'customer',
            status: 'active'
        })
        .select('-password')
        .sort({ createdAt: -1 });

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

// Suspend a customer
exports.suspendCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { reason } = req.body;

        const customer = await User.findByIdAndUpdate(
            customerId,
            {
                status: 'suspended',
                suspensionReason: reason,
                suspendedAt: new Date()
            },
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer suspended successfully",
            customer
        });
    } catch (error) {
        console.error("Error suspending customer:", error);
        res.status(500).json({
            success: false,
            message: "Failed to suspend customer",
            error: error.message
        });
    }
};

// Get all suspended customers
exports.getSuspendedCustomers = async (req, res) => {
    try {
        const customers = await User.find({ 
            role: 'customer',
            status: 'suspended'
        })
        .select('-password')
        .sort({ suspendedAt: -1 });

        res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (error) {
        console.error("Error fetching suspended customers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch suspended customers",
            error: error.message
        });
    }
};

// Restore a suspended customer
exports.restoreCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await User.findByIdAndUpdate(
            customerId,
            {
                status: 'active',
                $unset: {
                    suspensionReason: 1,
                    suspendedAt: 1
                }
            },
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer restored successfully",
            customer
        });
    } catch (error) {
        console.error("Error restoring customer:", error);
        res.status(500).json({
            success: false,
            message: "Failed to restore customer",
            error: error.message
        });
    }
};

// Customer routes
router.get('/customers', authenticateAdmin, adminController.getAllCustomers);
router.get('/customers/suspended', authenticateAdmin, adminController.getSuspendedCustomers);
router.put('/customers/:customerId/suspend', authenticateAdmin, adminController.suspendCustomer);
router.put('/customers/:customerId/restore', authenticateAdmin, adminController.restoreCustomer);