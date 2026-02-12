// ========================================
// 🔐 ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ========================================

/**
 * Middleware factory to check if user has required role(s)
 * Usage: router.get('/admin/dashboard', authUser, requireRole('admin'), handler)
 * 
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Ensure user is authenticated first
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            // Convert single role to array for consistent handling
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Check if user's role is in the allowed roles
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Access Denied. Insufficient permissions."
                });
            }

            next();
        } catch (error) {
            console.log("RBAC Error:", error.message);
            res.status(500).json({
                success: false,
                message: "Authorization check failed"
            });
        }
    };
};

/**
 * Middleware to check if user is an admin
 * Usage: router.get('/admin/dashboard', authUser, requireAdmin, handler)
 */
const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin access required"
            });
        }

        next();
    } catch (error) {
        console.log("Admin Check Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Authorization check failed"
        });
    }
};

/**
 * Middleware to check if user is a lawyer
 * Usage: router.get('/lawyer/appointments', authLawyer, requireLawyer, handler)
 */
const requireLawyer = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (req.user.role !== 'lawyer') {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Lawyer access required"
            });
        }

        next();
    } catch (error) {
        console.log("Lawyer Check Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Authorization check failed"
        });
    }
};

/**
 * Middleware to check if user owns the resource
 * Compares req.user.id with req.params.userId or req.body.userId
 * Usage: router.put('/user/:userId/profile', authUser, requireOwnership, handler)
 */
const requireOwnership = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const resourceUserId = req.params.userId || req.body.userId;

        if (!resourceUserId) {
            return res.status(400).json({
                success: false,
                message: "User ID not found in request"
            });
        }

        // Allow if user is admin or owns the resource
        if (req.user.role === 'admin' || req.user.id === resourceUserId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Forbidden: You can only access your own resources"
        });
    } catch (error) {
        console.log("Ownership Check Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Authorization check failed"
        });
    }
};

export { requireRole, requireAdmin, requireLawyer, requireOwnership };
export default requireRole;
