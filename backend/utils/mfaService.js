import crypto from "crypto";
import jwt from "jsonwebtoken";

// -----------------------------------------------------------------------
//
// 1. AWS SES + Redis:
//    - Use AWS SES (Simple Email Service) for reliable email delivery
//    - Store OTPs in Redis with TTL for automatic expiration
//    - Example:
//      import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
//      import Redis from "ioredis";
//      const redis = new Redis(process.env.REDIS_URL);
//      await redis.setex(`mfa:${userId}`, 300, otp); // 5 min TTL
//
// 2. Google Authenticator / TOTP (Time-based One-Time Password):
//    - Uses apps like Google Authenticator or Authy
//    - No email/SMS needed, works offline
//    - Example:
//      import speakeasy from "speakeasy";
//      const secret = speakeasy.generateSecret({ name: "MeetMyLawyer" });
//      const verified = speakeasy.totp.verify({ secret, token: userOTP });
// -----------------------------------------------------------------------

const mfaOtpStore = new Map();

/**
 * Generate a 6-digit OTP, store it in memory, and send it via email.
 * Returns a short-lived mfaToken (JWT) that proves the user passed the password step.
 */
export const initiateMFA = async (userId, email, role) => {
  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store with 5-minute expiry and max 3 verification attempts
  mfaOtpStore.set(userId.toString(), {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  // Send OTP via existing Brevo email infrastructure
  const { sendOTPEmail } = await import("../config/simpleEmail.js");
  await sendOTPEmail(email, otp);

  // -----------------------------------------------------------------------
  //
  // AWS SES Example:
  //   const ses = new SESClient({ region: "us-east-1" });
  //   await ses.send(new SendEmailCommand({
  //     Source: "noreply@meetmylawyer.com",
  //     Destination: { ToAddresses: [email] },
  //     Message: {
  //       Subject: { Data: "Your MFA Code" },
  //       Body: { Text: { Data: `Your verification code is: ${otp}` } }
  //     }
  //   }));
  //
  // -----------------------------------------------------------------------

  // Return a short-lived MFA token (5 minutes) - NOT the real auth token
  // This token only proves the user entered the correct password
  const mfaToken = jwt.sign(
    { id: userId, role, mfaPending: true },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  return mfaToken;
};

/**
 * Verify the OTP that the user entered.
 * Returns { valid: boolean, message: string }
 */
export const verifyMFAOtp = (userId, otp) => {
  const stored = mfaOtpStore.get(userId.toString());

  if (!stored) {
    return { valid: false, message: "OTP not found or expired. Please login again." };
  }

  // Check if OTP has expired
  if (Date.now() > stored.expiresAt) {
    mfaOtpStore.delete(userId.toString());
    return { valid: false, message: "OTP has expired. Please login again." };
  }

  // Check max attempts
  if (stored.attempts >= 3) {
    mfaOtpStore.delete(userId.toString());
    return { valid: false, message: "Too many incorrect attempts. Please login again." };
  }

  // Verify OTP
  if (stored.otp === otp) {
    mfaOtpStore.delete(userId.toString());
    return { valid: true, message: "OTP verified successfully" };
  }

  // Wrong OTP - increment attempts
  stored.attempts++;
  return {
    valid: false,
    message: `Incorrect OTP. ${3 - stored.attempts} attempt(s) remaining.`,
  };
};
