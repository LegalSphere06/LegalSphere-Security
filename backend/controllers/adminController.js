import validator from "validator";
import {
  uploadImageToCloudinary,
  hashPassword,
  validatePassword,
  buildLawyerData,
  checkLawyerExists,
} from '../utils/lawyerUtils.js';
import lawyerModel from "../models/lawyerModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import applicationModel from "../models/applicationModel.js";
import { sendApprovalEmail, sendRejectionEmail, sendBulkEmail } from '../config/emailConfig.js';


// API for adding lawyer
const addLawyer = async (req, res) => {
  try {
    console.log("Request received at addLawyer controller");

    const { name, email, password, speciality, district, license_number, method, online_link } = req.body;
    const imageFile = req.file;

    // Validate required fields
    if (!name || !email || !password || !speciality || !district || !license_number) {
      return res.json({ success: false, message: "Missing Required Details" });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please Enter a valid Email" });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.json({ success: false, message: passwordValidation.message });
    }

    // Check if lawyer exists
    const existingLawyer = await checkLawyerExists(lawyerModel, email, license_number);
    if (existingLawyer) {
      const field = existingLawyer.email === email ? 'email' : 'license number';
      return res.json({
        success: false,
        message: `Lawyer with this ${field} already exists`,
      });
    }

    // Validate online consultation
    if (method === "online" && !online_link) {
      return res.json({
        success: false,
        message: "Online link is required for online consultations",
      });
    }

    // Upload image
    let imageUrl = '';
    try {
      imageUrl = await uploadImageToCloudinary(imageFile);
    } catch (uploadError) {
      return res.json({ success: false, message: uploadError.message });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Build lawyer data
    const lawyerData = buildLawyerData(req.body, imageUrl, hashedPassword);

    // Save lawyer
    const newLawyer = new lawyerModel(lawyerData);
    await newLawyer.save();

    console.log("Lawyer saved successfully");
    res.json({ success: true, message: "Lawyer Added" });

  } catch (error) {
    console.error("[addLawyer] Error:", error.message, error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.json({
        success: false,
        message: `A lawyer with this ${field} (${value}) already exists`
      });
    }

    res.json({ success: false, message: error.message });
  }
};

// API For admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Securely sign a payload without sensitive data (password)
      const token = jwt.sign({ role: 'admin', email: email }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all lawyers list for admin panel
const allLawyers = async (req, res) => {
  try {
    //.sort() to show newest first
    const lawyers = await lawyerModel.find({}).select("-password").sort({ date: -1 });
    res.json({ success: true, lawyers });
  } catch (error) {
    console.log("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({})
    res.json({ success: true, appointments })
  } catch (error) {
    console.log("Error:", error);
    res.json({ success: false, message: error.message });
  }
}

//API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

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

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const lawyersCount = await lawyerModel.countDocuments({});
    const usersCount = await userModel.countDocuments({});
    const appointmentsCount = await appointmentModel.countDocuments({});
    const latestAppointments = await appointmentModel.find({}).sort({ date: -1 }).limit(5);

    const dashData = {
      lawyers: lawyersCount,
      appointments: appointmentsCount,
      clients: usersCount,
      latestAppointments: latestAppointments
    }

    res.json({ success: true, dashData })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

//API to get all the applications from the lawyers
const getApplications = async (req, res) => {
  try {
    const applications = await applicationModel.find().sort({ application_date: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
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
    console.log("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to update lawyer details (now includes password updates)
const updateLawyer = async (req, res) => {
  try {
    console.log("Request received at updateLawyer controller");

    const { lawyerId } = req.params;
    const { email, password, license_number } = req.body;
    const imageFile = req.file;

    // Find existing lawyer
    const existingLawyer = await lawyerModel.findById(lawyerId);
    if (!existingLawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Check if email/license is being changed and if it already exists
    if (email !== existingLawyer.email || license_number !== existingLawyer.license_number) {
      const duplicateLawyer = await checkLawyerExists(lawyerModel, email, license_number, lawyerId);
      if (duplicateLawyer) {
        const field = duplicateLawyer.email === email ? 'email' : 'license number';
        return res.json({
          success: false,
          message: `Another lawyer with this ${field} already exists`,
        });
      }
    }

    // Handle password update
    let hashedPassword = existingLawyer.password;
    if (password && password.trim() !== '') {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.json({ success: false, message: passwordValidation.message });
      }
      hashedPassword = await hashPassword(password);
      console.log("New password hashed for lawyer:", req.body.name);
    }

    // Handle image update
    let imageUrl = existingLawyer.image;
    try {
      const newImageUrl = await uploadImageToCloudinary(imageFile);
      if (newImageUrl) {
        imageUrl = newImageUrl;
      }
    } catch (uploadError) {
      return res.json({ success: false, message: uploadError.message });
    }

    // Build update data
    const updateData = buildLawyerData(req.body, imageUrl, hashedPassword);

    // Update lawyer
    await lawyerModel.findByIdAndUpdate(lawyerId, updateData, { new: true });

    res.json({ success: true, message: "Lawyer updated successfully" });

  } catch (error) {
    console.error("[updateLawyer] Error:", error.message, error);
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

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.json({ success: false, message: passwordValidation.message });
    }

    // Check if lawyer exists
    const lawyer = await lawyerModel.findById(lawyerId);
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await lawyerModel.findByIdAndUpdate(lawyerId, { password: hashedPassword });

    console.log(`Password reset for lawyer: ${lawyer.name} (${lawyer.email})`);
    res.json({ success: true, message: "Password reset successfully" });

  } catch (error) {
    console.error("[resetLawyerPassword] Error:", error.message, error);
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
    console.log("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete lawyer
const deleteLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    // Check if lawyer exists
    const lawyer = await lawyerModel.findById(lawyerId);
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Delete the lawyer
    await lawyerModel.findByIdAndDelete(lawyerId);

    res.json({ success: true, message: "Lawyer deleted successfully" });

  } catch (error) {
    console.log("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to approve application and create lawyer account
const approveApplication = async (req, res) => {
  try {
    console.log("Approve application called with body:", req.body);
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.json({ success: false, message: "Application ID is required" });
    }

    const application = await applicationModel.findById(applicationId);
    if (!application) {
      return res.json({ success: false, message: "Application not found" });
    }

    // Check if lawyer exists
    const existingLawyer = await checkLawyerExists(
      lawyerModel,
      application.application_email,
      application.application_license_number
    );
    if (existingLawyer) {
      return res.json({
        success: false,
        message: "A lawyer with this email or license number already exists"
      });
    }

    // Validate password from application
    const passwordValidation = validatePassword(application.application_password);
    if (!passwordValidation.valid) {
      return res.json({
        success: false,
        message: `Application password issue: ${passwordValidation.message}`
      });
    }

    // Store plain password for email
    const plainPassword = application.application_password;

    // Hash password
    const hashedPassword = await hashPassword(application.application_password);

    // Map application data to lawyer data format
    const mappedData = {
      name: application.application_name,
      email: application.application_email,
      phone: application.application_phone,
      office_phone: application.application_office_phone,
      speciality: application.application_speciality,
      gender: application.application_gender,
      dob: application.application_dob,
      degree: application.application_degree,
      district: application.application_district,
      license_number: application.application_license_number,
      bar_association: application.application_bar_association,
      experience: application.application_experience,
      languages_spoken: application.application_languages_spoken,
      about: application.application_about,
      legal_professionals: application.application_legal_professionals,
      fees: application.application_fees,
      address: application.application_address,
      latitude: application.application_latitude,
      longitude: application.application_longitude,
      court1: application.application_court1,
      court2: application.application_court2,
    };

    // Build lawyer data
    const lawyerData = buildLawyerData(
      mappedData,
      application.application_image || '',
      hashedPassword
    );

    console.log("Creating lawyer with data:", { name: lawyerData.name, email: lawyerData.email });

    // Create lawyer
    const newLawyer = new lawyerModel(lawyerData);
    await newLawyer.save();

    console.log("Lawyer created successfully with ID:", newLawyer._id);

    // Send approval email
    const emailSent = await sendApprovalEmail(
      application.application_email,
      application.application_name,
      plainPassword
    );

    if (!emailSent) {
      console.warn("Warning: Welcome email could not be sent, but lawyer account was created");
    }

    // Delete application
    await applicationModel.findByIdAndDelete(applicationId);
    console.log("Application deleted");

    res.json({
      success: true,
      message: emailSent
        ? "Application approved successfully. Lawyer account created and welcome email sent."
        : "Application approved successfully. Lawyer account created (email sending failed).",
      lawyerId: newLawyer._id,
      emailSent: emailSent
    });

  } catch (error) {
    console.error("[approveApplication] Error:", error.message, error);
    res.json({
      success: false,
      message: error.message || "Failed to approve application"
    });
  }
};

// API to reject application
const rejectApplication = async (req, res) => {
  try {
    console.log("Reject application called with body:", req.body);
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.json({
        success: false,
        message: "Application ID is required"
      });
    }

    // Find the application first to get email for notification
    const application = await applicationModel.findById(applicationId);

    if (!application) {
      return res.json({
        success: false,
        message: "Application not found"
      });
    }

    // Call the rejection email function (if you create it)
    await sendRejectionEmail(
      application.application_email,
      application.application_name
    );

    // Delete the application
    await applicationModel.findByIdAndDelete(applicationId);
    console.log(`Application rejected and deleted for: ${application.application_email}`);

    console.log("=================================");
    console.log("APPLICATION REJECTED");
    console.log("Applicant:", application.application_name);
    console.log("Email:", application.application_email);
    console.log("=================================");

    res.json({
      success: true,
      message: "Application rejected and removed from the system."
    });

  } catch (error) {
    console.error("Error rejecting application:", error);
    res.json({
      success: false,
      message: error.message || "Failed to reject application"
    });
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

    // sendBulkEmail is already imported at the top
    const emailSent = await sendBulkEmail(recipientEmails, subject, message);

    if (emailSent) {
      res.json({ success: true, message: `Email sent successfully to ${recipientEmails.length} lawyer(s)` });
    } else {
      res.json({ success: false, message: "Failed to send emails. Please check email configuration." });
    }

  } catch (error) {
    console.error("Error sending emails:", error);
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