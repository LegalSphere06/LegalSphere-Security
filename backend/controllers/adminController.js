import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import lawyerModel from "../models/lawyerModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import applicationModel from "../models/applicationModel.js";
import { sendApprovalEmail, sendRejectionEmail, sendBulkEmail } from '../config/emailConfig.js';
import { validatePassword } from "../utils/passwordValidator.js";
import { initiateMFA } from "../utils/mfaService.js";


// API for adding lawyer
const addLawyer = async (req, res) => {
  try {
    console.log("Request received at addLawyer controller");

    const {
      name,
      email,
      password,
      phone,
      office_phone,
      speciality,
      gender,
      dob,
      degree,
      district,
      license_number,
      bar_association,
      experience,
      languages_spoken,
      about,
      available,
      legal_professionals,
      fees,
      total_reviews,
      address,
      latitude,
      longitude,
      court1,
      court2,
      date,
      slots_booked,
      method,
      online_link,
    } = req.body;

    const imageFile = req.file;

    // Type check - prevent NoSQL injection
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.json({ success: false, message: 'Invalid input format' });
    }

    // checking for required lawyer data only
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !district ||
      !license_number
    ) {
      return res.json({ success: false, message: "Missing Required Details" });
    }

    // validating email formatting
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please Enter a valid Email",
      });
    }

    // validating strong Password
    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      return res.json({
        success: false,
        message: pwCheck.message,
      });
    }

    // Check if lawyer with this email already exists
    const existingLawyer = await lawyerModel.findOne({ email: email.toLowerCase().trim() });
    if (existingLawyer) {
      return res.json({
        success: false,
        message: "Lawyer with this email already exists",
      });
    }

    // Online Link validation
    if (method === "online" && !online_link) {
      return res.json({
        success: false,
        message: "Online link is required for online consultations",
      });
    }

    // Hashing Lawyer's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = '';

    // Upload Image to cloudinary if image exists
    if (imageFile) {
      try {
        const b64 = Buffer.from(imageFile.buffer).toString("base64");
        const dataURI = "data:" + imageFile.mimetype + ";base64," + b64;

        const imageUpload = await cloudinary.uploader.upload(dataURI, {
          resource_type: "image",
          folder: "lawyers",
          timeout: 60000,
        });

        imageUrl = imageUpload.secure_url;

      } catch (uploadError) {
        return res.json({ success: false, message: "Image upload failed: " + uploadError.message });
      }
    }

    const lawyerData = {
      name,
      email: email.toLowerCase().trim(),
      image: imageUrl,
      password: hashedPassword,
      phone,
      office_phone,
      speciality,
      gender,
      dob,
      degree,
      district,
      license_number,
      bar_association,
      experience,
      languages_spoken: Array.isArray(languages_spoken) ? languages_spoken : [languages_spoken].filter(Boolean),
      about: about || 'No additional information provided',
      available: available !== undefined ? available : true,
      legal_professionals,
      fees: fees ? Number(fees) : 0,
      total_reviews: total_reviews || 0,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      court1,
      court2,
      date: Date.now(),
      slots_booked: slots_booked || {},
      method: method || 'both',
      online_link: online_link || '',
    };

    try {
      const newLawyer = new lawyerModel(lawyerData);
      await newLawyer.save();
      res.json({ success: true, message: "Lawyer Added" });
    } catch (saveError) {
      if (saveError.code === 11000) {
        const field = Object.keys(saveError.keyValue)[0];
        const value = saveError.keyValue[field];
        return res.json({
          success: false,
          message: `A lawyer with this ${field} (${value}) already exists`
        });
      }
      return res.json({
        success: false,
        message: "Failed to save lawyer: " + saveError.message
      });
    }

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API For admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Type check - prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.json({ success: false, message: 'Invalid input format' });
    }

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const mfaToken = await initiateMFA("admin", process.env.ADMIN_EMAIL, "admin");
      return res.json({
        success: true,
        requiresMFA: true,
        mfaToken,
        message: "Verification code sent to admin email.",
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API to get all lawyers list for admin panel
const allLawyers = async (req, res) => {
  try {
    const lawyers = await lawyerModel.find({}).select("-password").sort({ date: -1 });
    res.json({ success: true, lawyers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({})
    res.json({ success: true, appointments })
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

//API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    const { lawyerId, slotDate, slotTime } = appointmentData
    const lawyerData = await lawyerModel.findById(lawyerId)

    let slots_booked = lawyerData.slots_booked
    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

    await lawyerModel.findByIdAndUpdate(lawyerId, { slots_booked })
    res.json({ success: true, message: 'Appointment Cancelled' })

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const lawyers = await lawyerModel.find({})
    const users = await userModel.find({})
    const appointments = await appointmentModel.find({})

    const dashData = {
      lawyers: lawyers.length,
      appointments: appointments.length,
      clients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5)
    }

    res.json({ success: true, dashData })

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

//API to get all the applications from the lawyers
const getApplications = async (req, res) => {
  try {
    const applications = await applicationModel.find().sort({ application_date: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get single lawyer details for editing
const getLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const lawyer = await lawyerModel.findById(lawyerId).select("-password");

    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    res.json({ success: true, lawyer });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to update lawyer details (now includes password updates)
const updateLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const {
      name,
      email,
      password,
      phone,
      office_phone,
      speciality,
      gender,
      dob,
      degree,
      district,
      license_number,
      bar_association,
      experience,
      languages_spoken,
      about,
      available,
      legal_professionals,
      fees,
      address,
      latitude,
      longitude,
      court1,
      method,
      online_link,
    } = req.body;

    const imageFile = req.file;

    // Type check - prevent NoSQL injection
    if (typeof email !== 'string' || typeof name !== 'string') {
      return res.json({ success: false, message: 'Invalid input format' });
    }

    // Find existing lawyer
    const existingLawyer = await lawyerModel.findById(lawyerId);
    if (!existingLawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Check if email is being changed and if new email already exists
    if (email !== existingLawyer.email) {
      const emailExists = await lawyerModel.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: lawyerId } 
      });
      if (emailExists) {
        return res.json({
          success: false,
          message: "Another lawyer with this email already exists",
        });
      }
    }

    // Validate and hash new password if provided
    let hashedPassword = existingLawyer.password;
    if (password && password.trim() !== '') {
      const pwCheck = validatePassword(password);
      if (!pwCheck.isValid) {
        return res.json({
          success: false,
          message: pwCheck.message,
        });
      }

      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    let imageUrl = existingLawyer.image;

    // Upload new image if provided
    if (imageFile) {
      try {
        const b64 = Buffer.from(imageFile.buffer).toString("base64");
        const dataURI = "data:" + imageFile.mimetype + ";base64," + b64;

        const imageUpload = await cloudinary.uploader.upload(dataURI, {
          resource_type: "image",
          folder: "lawyers",
          timeout: 60000,
        });

        imageUrl = imageUpload.secure_url;

      } catch (uploadError) {
        return res.json({ success: false, message: "Image upload failed: " + uploadError.message });
      }
    }

    const updateData = {
      name,
      email: email.toLowerCase().trim(),
      image: imageUrl,
      password: hashedPassword,
      phone,
      office_phone,
      speciality,
      gender,
      dob,
      degree,
      district,
      license_number,
      bar_association,
      experience,
      languages_spoken: Array.isArray(languages_spoken) ? languages_spoken : [languages_spoken].filter(Boolean),
      about: about || 'No additional information provided',
      available: available !== undefined ? available : true,
      legal_professionals,
      fees: fees ? Number(fees) : 0,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      court1,
      method: method || 'both',
      online_link: online_link || '',
    };

    await lawyerModel.findByIdAndUpdate(lawyerId, updateData, { new: true });
    res.json({ success: true, message: "Lawyer updated successfully" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to reset lawyer password (separate function for admin use)
const resetLawyerPassword = async (req, res) => {
  try {
    const { lawyerId, newPassword } = req.body;

    if (!lawyerId || !newPassword) {
      return res.json({ success: false, message: "Lawyer ID and new password are required" });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) {
      return res.json({ success: false, message: pwCheck.message });
    }

    const lawyer = await lawyerModel.findById(lawyerId);
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await lawyerModel.findByIdAndUpdate(lawyerId, { password: hashedPassword });
    res.json({ success: true, message: "Password reset successfully" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to check if lawyer has password (for admin panel UI)
const checkLawyerPassword = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    const lawyer = await lawyerModel.findById(lawyerId).select('name email password');
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    res.json({
      success: true,
      hasPassword: !!lawyer.password,
      lawyerName: lawyer.name,
      lawyerEmail: lawyer.email
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to delete lawyer
const deleteLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    const lawyer = await lawyerModel.findById(lawyerId);
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    await lawyerModel.findByIdAndDelete(lawyerId);
    res.json({ success: true, message: "Lawyer deleted successfully" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to approve application and create lawyer account
const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    
    if (!applicationId) {
      return res.json({ success: false, message: "Application ID is required" });
    }
    
    const application = await applicationModel.findById(applicationId);
    if (!application) {
      return res.json({ success: false, message: "Application not found" });
    }

    const existingLawyer = await lawyerModel.findOne({
      $or: [
        { email: application.application_email },
        { license_number: application.application_license_number }
      ]
    });

    if (existingLawyer) {
      return res.json({
        success: false,
        message: "A lawyer with this email or license number already exists"
      });
    }

    if (!application.application_password || application.application_password.trim() === '') {
      return res.json({
        success: false,
        message: "Application does not contain a password."
      });
    }

    const pwCheck = validatePassword(application.application_password);
    if (!pwCheck.isValid) {
      return res.json({ success: false, message: pwCheck.message });
    }

    // ✅ R6 Fix - removed plainPassword variable
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(application.application_password, salt);

    const lawyerData = {
      name: application.application_name,
      email: application.application_email,
      password: hashedPassword,
      phone: application.application_phone,
      office_phone: application.application_office_phone || "",
      image: application.application_image || "",
      speciality: application.application_speciality,
      gender: application.application_gender,
      dob: application.application_dob || "Not Selected",
      degree: application.application_degree || [],
      district: application.application_district,
      license_number: application.application_license_number,
      bar_association: application.application_bar_association,
      experience: application.application_experience,
      languages_spoken: application.application_languages_spoken || [],
      about: application.application_about || "Professional lawyer",
      available: true,
      legal_professionals: application.application_legal_professionals || [],
      fees: application.application_fees || 1000,
      total_reviews: 0,
      address: application.application_address || { street: "", district: application.application_district },
      latitude: application.application_latitude || 0,
      longitude: application.application_longitude || 0,
      court1: application.application_court1,
      court2: application.application_court2 || "",
      date: Date.now(),
      slots_booked: {},
      method: "both",
      online_link: ""
    };

    const newLawyer = new lawyerModel(lawyerData);
    await newLawyer.save();

    // ✅ R11/R12 Fix - no plain password sent via email
    const emailSent = await sendApprovalEmail(
      application.application_email,
      application.application_name
    );

    if (!emailSent) {
      console.log("Warning: Welcome email could not be sent, but lawyer account was created");
    }

    await applicationModel.findByIdAndDelete(applicationId);

    res.json({ 
      success: true, 
      message: emailSent 
        ? "Application approved successfully. Lawyer account created and welcome email sent."
        : "Application approved successfully. Lawyer account created (email sending failed).",
      lawyerId: newLawyer._id,
      emailSent: emailSent
    });

  } catch (error) {
    res.json({ success: false, message: error.message || "Failed to approve application" });
  }
};

// API to reject application
const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    
    if (!applicationId) {
      return res.json({ success: false, message: "Application ID is required" });
    }
    
    const application = await applicationModel.findById(applicationId);
    if (!application) {
      return res.json({ success: false, message: "Application not found" });
    }

    await sendRejectionEmail(
      application.application_email,
      application.application_name
    );

    await applicationModel.findByIdAndDelete(applicationId);

    res.json({ success: true, message: "Application rejected and removed from the system." });

  } catch (error) {
    res.json({ success: false, message: error.message || "Failed to reject application" });
  }
};

// API to send email to lawyers
const sendEmailToLawyers = async (req, res) => {
  try {
    const { recipientEmails, subject, message } = req.body;

    if (!recipientEmails || recipientEmails.length === 0) {
      return res.json({ success: false, message: "No recipients selected" });
    }

    if (!subject || !message) {
      return res.json({ success: false, message: "Subject and message are required" });
    }

    const emailSent = await sendBulkEmail(recipientEmails, subject, message);

    if (emailSent) {
      res.json({ success: true, message: `Email sent successfully to ${recipientEmails.length} lawyer(s)` });
    } else {
      res.json({ success: false, message: "Failed to send emails. Please check email configuration." });
    }

  } catch (error) {
    res.json({ success: false, message: error.message || "Server error occurred while sending emails" });
  }
};


export {
  addLawyer,
  loginAdmin,
  allLawyers,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  getApplications,
  getLawyer,
  updateLawyer,
  deleteLawyer,
  resetLawyerPassword,
  checkLawyerPassword,
  approveApplication,
  rejectApplication,
  sendEmailToLawyers
};