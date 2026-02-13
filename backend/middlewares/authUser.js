import jwt from "jsonwebtoken";

// ========================================
// 🔐 USER AUTHENTICATION MIDDLEWARE
// ========================================

/**
 * Authenticates user JWT token and attaches user info to request
 * Supports Role-Based Access Control (RBAC)
 */
const authUser = async (req, res, next) => {
  try {
    // Get token from header (supports both formats)
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No token provided"
      });
    }

    // Verify token
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request for downstream use
    req.body = req.body || {};
    req.body.userId = token_decode.id;

    // Attach full user object for RBAC (if token contains role)
    req.user = {
      id: token_decode.id,
      role: token_decode.role || 'user',
      email: token_decode.email
    };

    next();
  } catch (error) {
    console.log("Authentication Error:", error.message);

    // Specific error messages for different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again."
      });
    }

    res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

export default authUser;
