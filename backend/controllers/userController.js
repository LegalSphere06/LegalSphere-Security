import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import lawyerModel from "../models/lawyerModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from 'razorpay';
import crypto from 'crypto';
import { validatePassword } from "../utils/passwordValidator.js";
import { initiateMFA } from "../utils/mfaService.js";

// API to register user enhancement
const registerUser = async (req, res) => {
  try {
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

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

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const secondsLeft = Math.ceil((user.accountLockedUntil - Date.now()) / 1000);
      return res.json({
        success: false,
        message: `Account is locked. Try again in ${secondsLeft} second(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const update = { failedLoginAttempts: attempts };
      if (attempts >= 3) {
        update.accountLockedUntil = new Date(Date.now() + 30 * 1000);
        update.failedLoginAttempts = 0;
      }
      await userModel.findByIdAndUpdate(user._id, update);
      return res.json({ success: false, message: "Invalid credentials" });
    }

    await userModel.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    });

    if (user.mfaEnabled !== false) {
      const mfaToken = await initiateMFA(user._id.toString(), user.email, "user");
      return res.json({
        success: true,
        requiresMFA: true,
        mfaToken,
        message: "Verification code sent to your email.",
      });
    }

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
};

//API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, lawyerId, slotDate, slotTime, consultationType } = req.body;

    const lawyerData = await lawyerModel.findById(lawyerId).select('-password');

    if (!lawyerData) {
      return res.json({ success: false, message: 'Lawyer not found' });
    }

    if (!lawyerData.available) {
      return res.json({ success: false, message: 'Lawyer not available' });
    }
    
    let slots_booked = lawyerData.slots_booked;

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Slot not available' });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select('-password');
    delete lawyerData.slots_booked;

    const appointmentData = {
      userId,
      lawyerId,
      userData,
      lawyerData,
      amount: lawyerData.fees,
      slotTime,
      slotDate,
      consultationType,
      date: Date.now()
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await lawyerModel.findByIdAndUpdate(lawyerId, { slots_booked });
    res.json({ success: true, message: 'Appointment Booked' });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get user appointments
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;

    // ✅ R8 Fix - Type check added
    if (typeof userId !== 'string') {
      return res.json({ success: false, message: 'Invalid input format' });
    }

    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    const { lawyerId, slotDate, slotTime } = appointmentData;
    const lawyerData = await lawyerModel.findById(lawyerId);
    let slots_booked = lawyerData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
    await lawyerModel.findByIdAndUpdate(lawyerId, { slots_booked });

    res.json({ success: true, message: 'Appointment Cancelled' });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

//API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: "Appointment Cancelled or not Found" });
    }

    // ✅ R9 Fix - Server-side amount validation
    if (!appointmentData.amount || appointmentData.amount <= 0) {
      return res.json({ success: false, message: "Invalid payment amount" });
    }

    // ✅ R9 Fix - Generate unique server-side order
    const options = {
      amount: Math.round(appointmentData.amount * 100), // amount from DB not from user
      currency: process.env.CURRENCY,
      receipt: appointmentId,
      payment_capture: 1 // auto capture
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, order });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // ✅ R9/R10 Fix - Verify webhook signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Payment verification failed" });
    }

    // ✅ R9 Fix - Fetch order from Razorpay to confirm status
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === 'paid') {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

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

export { 
  registerUser, 
  loginUser, 
  getProfile, 
  updateProfile, 
  bookAppointment, 
  listAppointment, 
  cancelAppointment, 
  paymentRazorpay, 
  verifyRazorpay, 
  getUsersForGIS, 
  toggleMFA 
};