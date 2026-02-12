// ========================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ========================================

/**
 * Generic authorization response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
const sendAuthError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

/**
 * Generic authentication check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} - True if authenticated, false otherwise
 */
const isAuthenticated = (req, res) => {
    if (!req.user) {
        sendAuthError(res, 401, "Authentication required");
        return false;
    }
    return true;
};

/**
 * Generic error handler for middleware
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} context - Context description for logging
 */
const handleAuthError = (res, error, context) => {
    console.error(`[${context}] Error:`, error.message, error);
    sendAuthError(res, 500, "Authorization check failed");
};

/**
 * Generic role-based access control middleware
 * @param {string|Array<string>} allowedRoles - Role(s) allowed to access
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check authentication
            if (!isAuthenticated(req, res)) return;

            // Normalize roles to array
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Check authorization
            if (!roles.includes(req.user.role)) {
                return sendAuthError(
                    res,
                    403,
                    "Forbidden: Access Denied. Insufficient permissions."
                );
            }

            next();
        } catch (error) {
            handleAuthError(res, error, "RBAC");
        }
    };
};

/**
 * Admin-only access middleware
 */
const requireAdmin = (req, res, next) => {
    try {
        if (!isAuthenticated(req, res)) return;

        if (req.user.role !== 'admin') {
            return sendAuthError(res, 403, "Forbidden: Admin access required");
        }

        next();
    } catch (error) {
        handleAuthError(res, error, "Admin Check");
    }
};

/**
 * Lawyer-only access middleware
 */
const requireLawyer = (req, res, next) => {
    try {
        if (!isAuthenticated(req, res)) return;

        if (req.user.role !== 'lawyer') {
            return sendAuthError(res, 403, "Forbidden: Lawyer access required");
        }

        next();
    } catch (error) {
        handleAuthError(res, error, "Lawyer Check");
    }
};

/**
 * Ownership verification middleware
 * Allows access if user is admin or owns the resource
 */
const requireOwnership = (req, res, next) => {
    try {
        if (!isAuthenticated(req, res)) return;

        const resourceUserId = req.params.userId || req.body.userId;

        if (!resourceUserId) {
            return sendAuthError(res, 400, "User ID not found in request");
        }

        // Allow if user is admin or owns the resource
        if (req.user.role === 'admin' || req.user.id === resourceUserId) {
            return next();
        }

        return sendAuthError(
            res,
            403,
            "Forbidden: You can only access your own resources"
        );
    } catch (error) {
        handleAuthError(res, error, "Ownership Check");
    }
};

export { requireRole, requireAdmin, requireLawyer, requireOwnership };
export default requireRole;
