import jwt from "jsonwebtoken";
import { verifyMFAOtp } from "../utils/mfaService.js";

/**
 * POST /api/user/verify-mfa
 * POST /api/lawyer/verify-mfa
 * POST /api/admin/verify-mfa
 *
 * Body: { mfaToken, otp }
 * Returns: { success, token } - the real auth token on success
 */
export const verifyMFA = async (req, res) => {
  try {
    const { mfaToken, otp } = req.body;

    if (!mfaToken || !otp) {
      return res.json({ success: false, message: "MFA token and OTP are required." });
    }

    // Decode the short-lived MFA token
    let decoded;
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.json({ success: false, message: "MFA session expired. Please login again." });
      }
      return res.json({ success: false, message: "Invalid MFA token." });
    }

    // Ensure this is actually an MFA-pending token, not a real auth token
    if (!decoded.mfaPending) {
      return res.json({ success: false, message: "Invalid MFA token." });
    }

    // Verify the OTP
    const result = verifyMFAOtp(decoded.id, otp);

    if (!result.valid) {
      return res.json({ success: false, message: result.message });
    }

    // OTP verified - issue the real auth token
    const expiresIn = decoded.role === "admin" ? "1d" : "7d";

    const tokenPayload =
      decoded.role === "admin"
        ? { role: "admin", email: process.env.ADMIN_EMAIL }
        : { id: decoded.id, role: decoded.role };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn });

    res.json({ success: true, token });
  } catch (error) {
    console.log("MFA verification error:", error);
    res.json({ success: false, message: error.message });
  }
};