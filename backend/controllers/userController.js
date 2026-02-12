import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import lawyerModel from "../models/lawyerModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from 'razorpay'

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

    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a Strong Password" });
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
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
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
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

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

//API to make payment of appointment using razorpay

const paymentRazorpay = async (req, res) => {

  try {
    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: "Appointment Cancelled or not Found" })
    }

    // creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100, //remove 2 decimal points
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    }

    // creation of an order
    const order = await razorpayInstance.orders.create(options)

    res.json({ success: true, order })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }




}

//API to verify payment of razorpay

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

    console.log(orderInfo)
    if (orderInfo.status === 'paid') {
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

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, getUsersForGIS  };
