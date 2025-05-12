const authorizeRoles = (...allowedRoles) => {
    
    return (req, res, next) => {
        // 1. Check if user exists (authMiddleware must run first)
        if (!req.user) {
            console.log("❌ [ROLE] No user data in request");
            return res.status(500).json({
                success: false,
                message: "Internal server error: User data missing"
            });
        }

        // 2. Check if user has required role
        if (!allowedRoles.includes(req.user.role)) {
            console.log(`❌ [ROLE] ${req.user.role} attempted ${allowedRoles} route`);
            return res.status(403).json({
                success: false,
                message: `Forbidden: Requires ${allowedRoles.join(" or ")} role`
            });
        }

        console.log(`✅ [ROLE] ${req.user.role} authorized for ${allowedRoles}`);
        next();
    };
};

// Pre-defined role middlewares for convenience
const isAdmin = authorizeRoles('admin');
const isDriver = authorizeRoles('driver');
const isCustomer = authorizeRoles('customer');
const isDriverOrAdmin = authorizeRoles('driver', 'admin');

module.exports = {
    authorizeRoles,
    isAdmin,
    isDriver,
    isCustomer,
    isDriverOrAdmin
};