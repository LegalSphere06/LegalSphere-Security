import crypto from 'crypto';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP Email
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 10 minute expiration
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    // Send OTP email - FIXED IMPORT PATH
    const { sendOTPEmail } = await import('../config/simpleEmail.js');
    await sendOTPEmail(email, otp);

    console.log(`OTP sent to ${email}: ${otp}`); // Remove in production

    res.json({ 
      success: true, 
      message: "OTP sent successfully to your email" 
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.json({ 
      success: false, 
      message: "Failed to send OTP. Please try again." 
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.json({ 
        success: false, 
        message: "OTP not found or expired. Please request a new one." 
      });
    }

    // Check expiration
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.json({ 
        success: false, 
        message: "OTP has expired. Please request a new one." 
      });
    }

    // Check attempts (max 3)
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res.json({ 
        success: false, 
        message: "Too many incorrect attempts. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (storedData.otp === otp) {
      otpStore.delete(email);
      return res.json({ 
        success: true, 
        message: "OTP verified successfully" 
      });
    } else {
      storedData.attempts++;
      return res.json({ 
        success: false, 
        message: `Incorrect OTP. ${3 - storedData.attempts} attempts remaining.` 
      });
    }

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.json({ 
      success: false, 
      message: "Failed to verify OTP. Please try again." 
    });
  }
};