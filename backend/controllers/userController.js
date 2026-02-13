import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import lawyerModel from "../models/lawyerModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from 'razorpay'
import { validatePassword } from "../utils/passwordValidator.js";
import { initiateMFA } from "../utils/mfaService.js";

//***************************************************************** */
//imported the new model
// import paymentLogModel from '../models/paymentLogModel.js'
//****************************************************************** */


//******************************************************************************************* */
//No Razorpay signature verification

import crypto from "node:crypto"
//******************************************************************************************* */


// API to register user

const registerUser = async (req, res) => {
  try {
    //Validating
    const { name, email, password } = req.body;

    if (!name || !password || !email) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid Email" });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      return res.json({ success: false, message: pwCheck.message });
    }

    //Hashing User password using bcrypt

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();


//create a token
    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for user login

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Check account lockout
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const secondsLeft = Math.ceil((user.accountLockedUntil - Date.now()) / 1000);
      return res.json({
        success: false,
        message: `Account is locked. Try again in ${secondsLeft} second(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment failed attempts, lock after 5 failures
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const update = { failedLoginAttempts: attempts };
      if (attempts >= 3) {
        update.accountLockedUntil = new Date(Date.now() + 30 * 1000); // 30 sec lock (increase for production)
        update.failedLoginAttempts = 0;
      }
      await userModel.findByIdAndUpdate(user._id, update);
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Reset failed attempts on successful password
    await userModel.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    });

    // MFA: send OTP email and return mfaToken
    if (user.mfaEnabled !== false) {
      const mfaToken = await initiateMFA(user._id.toString(), user.email, "user");
      return res.json({
        success: true,
        requiresMFA: true,
        mfaToken,
        message: "Verification code sent to your email.",
      });
    }

    // Fallback if MFA disabled - issue token directly
    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user profile data

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // Upload image buffer to cloudinary (for memoryStorage)
      const b64 = Buffer.from(imageFile.buffer).toString("base64");
      const dataURI = `data:${imageFile.mimetype};base64,${b64}`;
      
      const imageUpload = await cloudinary.uploader.upload(dataURI, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};//API to book appointment

const bookAppointment = async (req, res) => {
  try {
    const { userId, lawyerId, slotDate, slotTime, consultationType } = req.body  // ADD consultationType here

    const lawyerData = await lawyerModel.findById(lawyerId).select('-password')

    // Check if lawyer exists first
    if (!lawyerData) {
      return res.json({ success: false, message: 'Lawyer not found' })
    }

    // Then check availability
    if (!lawyerData.available) {
      return res.json({ success: false, message: 'Lawyer not available' })
    }
    
    let slots_booked = lawyerData.slots_booked

    // Checking for slots availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Slot not available' })
      } else {
        slots_booked[slotDate].push(slotTime)
      }

    } else {
      slots_booked[slotDate] = []
      slots_booked[slotDate].push(slotTime)
    }

    const userData = await userModel.findById(userId).select('-password')

    delete lawyerData.slots_booked

    const appointmentData = {
      userId,
      lawyerId,
      userData,
      lawyerData,
      amount: lawyerData.fees,
      slotTime,
      slotDate,
      consultationType,  // ADD this line
      date: Date.now()
    }

    const newAppointment = new appointmentModel(appointmentData)
    await newAppointment.save()

    //Save new slots data in lawyerData

    await lawyerModel.findByIdAndUpdate(lawyerId, { slots_booked })

    res.json({ success: true, message: 'Appointment Booked' })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

//API to get user appointments for frontend  my_appointments page

const listAppointment = async (req, res) => {
  try {

    const { userId } = req.body
    const appointments = await appointmentModel.find({ userId })

    res.json({ success: true, appointments })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

//API to cancel appointment

const cancelAppointment = async (req, res) => {
  try {

    const { userId, appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    //Verify appointment user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" })

    }
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    //Releasing Lawyers slot

    const { lawyerId, slotDate, slotTime } = appointmentData

    const lawyerData = await lawyerModel.findById(lawyerId)

    let slots_booked = lawyerData.slots_booked

    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

    await lawyerModel.findByIdAndUpdate(lawyerId, { slots_booked })

    res.json({ success: true, message: 'Appointment Cancelled' })


  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// Lazy initialization - only create Razorpay instance when keys are available
let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys are not configured');
    }
    razorpayInstance = new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  }
  return razorpayInstance;
}

//API to make payment of appointment using razorpay

const paymentRazorpay = async (req, res) => {

 //********************************************************************* */
  try {
    const { userId, appointmentId } = req.body
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Validate appointmentId format to prevent injection
    if (!appointmentId || typeof appointmentId !== 'string' || appointmentId.length > 50) {
      return res.json({ success: false, message: "Invalid appointment reference" })
    }
//********************************************************************************************* */
    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: "Appointment Cancelled or not Found" })
    }

    // 1. Verify the appointment belongs to the authenticated user (prevent paying for others)
    if (appointmentData.userId !== userId) {
      await paymentLogModel.create({
        userId,
        appointmentId,
        amount: appointmentData.amount,
        status: 'flagged_fraud',
        ipAddress: clientIP,
        userAgent,
        flagReason: 'User attempted payment for appointment belonging to another user'
      })
      return res.json({ success: false, message: "Unauthorized - this appointment does not belong to you" })
    }

    // 2. Prevent duplicate payment - block if already paid
    if (appointmentData.payment) {
      return res.json({ success: false, message: "This appointment has already been paid for" })
    }

    // 3. Rate limiting - block automated bots spamming payment requests
    // Check for rapid payment attempts from same IP (more than 10 in 5 minutes)
    const recentIPAttempts = await paymentLogModel.countDocuments({
      ipAddress: clientIP,
      timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    })

    if (recentIPAttempts > 10) {
      await paymentLogModel.create({
        userId,
        appointmentId,
        amount: appointmentData.amount,
        status: 'flagged_fraud',
        ipAddress: clientIP,
        userAgent,
        flagReason: 'Excessive payment attempts from same IP - potential automated bot'
      })
      return res.json({ success: false, message: "Too many payment attempts. Please try again later." })
    }

    // Check for rapid payment attempts from same user (more than 5 in 5 minutes)
    const recentUserAttempts = await paymentLogModel.countDocuments({
      userId,
      timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    })

    if (recentUserAttempts > 5) {
      await paymentLogModel.create({
        userId,
        appointmentId,
        amount: appointmentData.amount,
        status: 'flagged_fraud',
        ipAddress: clientIP,
        userAgent,
        flagReason: 'Excessive payment attempts from same user account'
      })
      return res.json({ success: false, message: "Too many payment attempts. Please try again later." })
    }

    // 4. Validate amount is positive and within reasonable bounds
    if (!appointmentData.amount || appointmentData.amount <= 0 || appointmentData.amount > 1000000) {
      return res.json({ success: false, message: "Invalid payment amount" })
    }

    // creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY || 'INR',
      receipt: appointmentId,
    }

    // creation of an order
    const order = await getRazorpayInstance().orders.create(options)

    // 5. Log payment initiation for audit trail
    await paymentLogModel.create({
      userId,
      appointmentId,
      razorpay_order_id: order.id,
      amount: appointmentData.amount,
      currency: process.env.CURRENCY || 'INR',
      status: 'initiated',
      ipAddress: clientIP,
      userAgent
    })

    // 6. Return generic success response (no internal details leaked)
    res.json({ success: true, order })

  } catch (error) {
    console.error('Payment initiation error');
    res.json({ success: false, message: "Payment initiation failed. Please try again." });
  }

}

//API to verify payment of razorpay

const verifyRazorpay = async (req, res) => {
  try {
    const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.json({ success: false, message: "Missing payment verification details" })
    }

    // Verify payment signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Payment verification failed - invalid signature" })
    }

    // Signature verified, now confirm order status
    const orderInfo = await getRazorpayInstance().orders.fetch(razorpay_order_id)

    if (orderInfo.status === 'paid') {

      //********************************************************************************* */
      //Implement on no authentication check on payment verification.
      // Verify the appointment belongs to the authenticated user
      const appointmentData = await appointmentModel.findById(orderInfo.receipt)

      if (!appointmentData) {
        return res.json({ success: false, message: "Appointment not found" })
      }

      if (appointmentData.userId !== userId) {
        return res.json({ success: false, message: "Unauthorized - appointment does not belong to this user" })
      }
      //********************************************************************************* */

      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
      res.json({ success: true, message: "Payment Successful" })
    } else {
      res.json({ success: false, message: "Payment Failed" })
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// API to get all users with location data for GIS dashboard
const getUsersForGIS = async (req, res) => {
  try {
    const users = await userModel.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).select('name email district latitude longitude address');

    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to toggle MFA on/off for user
const toggleMFA = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const newMfaStatus = !user.mfaEnabled;
    await userModel.findByIdAndUpdate(userId, { mfaEnabled: newMfaStatus });

    res.json({
      success: true,
      mfaEnabled: newMfaStatus,
      message: `Two-factor authentication ${newMfaStatus ? "enabled" : "disabled"} successfully.`,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, getUsersForGIS, toggleMFA };
