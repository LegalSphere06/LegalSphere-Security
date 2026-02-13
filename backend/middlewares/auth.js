import jwt from "jsonwebtoken";

// Map each role to the header key used by the frontend
const ROLE_HEADER_MAP = {
  user: "token",
  lawyer: "dtoken",
  admin: "atoken",
};

/**
 * Unified RBAC authentication middleware factory.
 *
 * Usage:
 *   auth("user")          - only users allowed
 *   auth("admin")         - only admin allowed
 *   auth("lawyer")        - only lawyers allowed
 *   auth("user", "admin") - both users and admin allowed
 */
const auth = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Try each allowed role's header to find a token
      let token = null;
      for (const role of allowedRoles) {
        const headerKey = ROLE_HEADER_MAP[role];
        if (headerKey && req.headers[headerKey]) {
          token = req.headers[headerKey];
          break;
        }
      }

      if (!token) {
        return res.json({
          success: false,
          message: "Not Authorized. Please login again.",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if the token's role is in the allowed roles
      if (!decoded.role || !allowedRoles.includes(decoded.role)) {
        return res.json({
          success: false,
          message: "Insufficient permissions.",
        });
      }

      // For admin: verify email matches env variable
      if (decoded.role === "admin") {
        if (decoded.email !== process.env.ADMIN_EMAIL) {
          return res.json({
            success: false,
            message: "Not Authorized. Please login again.",
          });
        }
      }

      // Set identity on req.body for downstream handlers
      req.body = req.body || {};
      if (decoded.role === "user") {
        req.body.userId = decoded.id;
      } else if (decoded.role === "lawyer") {
        req.body.lawyerId = decoded.id;
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.json({
          success: false,
          message: "Session expired. Please login again.",
        });
      }
      console.log("Auth error:", error);
      res.json({ success: false, message: error.message });
    }
  };
};

export default auth;
