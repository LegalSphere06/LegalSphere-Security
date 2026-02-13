import {
  uploadImageToCloudinary,
  hashPassword,
  validatePassword,
  buildLawyerData,
  checkLawyerExists,
  sanitizeMongoId, // ADD THIS
} from '../utils/lawyerUtils.js';
import lawyerModel from "../models/lawyerModel.js";
import applicationModel from "../models/applicationModel.js";
import { sendApprovalEmail, sendRejectionEmail } from '../config/emailConfig.js';

// API to get single lawyer details for editing
const getLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    // CRITICAL: Sanitize MongoDB ID
    const sanitizedId = sanitizeMongoId(lawyerId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer ID format"
      });
    }

    const lawyer = await lawyerModel.findById(sanitizedId).select("-password");

    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    res.json({ success: true, lawyer });
  } catch (error) {
    console.error("[getLawyer] Error:", error.message, error);
    res.json({ success: false, message: error.message });
  }
};

// API to update lawyer details
const updateLawyer = async (req, res) => {
  try {
    console.log("Request received at updateLawyer controller");

    const { lawyerId } = req.params;
    const { email, password, license_number } = req.body;
    const imageFile = req.file;

    // CRITICAL: Sanitize MongoDB ID
    const sanitizedId = sanitizeMongoId(lawyerId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer ID format"
      });
    }

    // Find existing lawyer
    const existingLawyer = await lawyerModel.findById(sanitizedId);
    if (!existingLawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Check if email/license is being changed and if it already exists
    if (email !== existingLawyer.email || license_number !== existingLawyer.license_number) {
      const duplicateLawyer = await checkLawyerExists(lawyerModel, email, license_number, sanitizedId);
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

    // Update lawyer with sanitized ID
    await lawyerModel.findByIdAndUpdate(sanitizedId, updateData, { new: true });

    res.json({ success: true, message: "Lawyer updated successfully" });

  } catch (error) {
    console.error("[updateLawyer] Error:", error.message, error);
    res.json({ success: false, message: error.message });
  }
};

// API to check if lawyer has password
const checkLawyerPassword = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    // CRITICAL: Sanitize MongoDB ID
    const sanitizedId = sanitizeMongoId(lawyerId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer ID format"
      });
    }

    const lawyer = await lawyerModel.findById(sanitizedId).select('name email password');

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
    console.error("[checkLawyerPassword] Error:", error.message, error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete lawyer
const deleteLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    // CRITICAL: Sanitize MongoDB ID
    const sanitizedId = sanitizeMongoId(lawyerId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer ID format"
      });
    }

    // Check if lawyer exists
    const lawyer = await lawyerModel.findById(sanitizedId);
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Delete the lawyer
    await lawyerModel.findByIdAndDelete(sanitizedId);

    res.json({ success: true, message: "Lawyer deleted successfully" });

  } catch (error) {
    console.error("[deleteLawyer] Error:", error.message, error);
    res.json({ success: false, message: error.message });
  }
};

// API to reset lawyer password
const resetLawyerPassword = async (req, res) => {
  try {
    const { lawyerId, newPassword } = req.body;

    // CRITICAL: Sanitize MongoDB ID from body
    const sanitizedId = sanitizeMongoId(lawyerId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer ID format"
      });
    }

    if (!newPassword) {
      return res.json({ success: false, message: "New password is required" });
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.json({ success: false, message: passwordValidation.message });
    }

    // Check if lawyer exists
    const lawyer = await lawyerModel.findById(sanitizedId);
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await lawyerModel.findByIdAndUpdate(sanitizedId, { password: hashedPassword });

    console.log(`Password reset for lawyer: ${lawyer.name} (${lawyer.email})`);
    res.json({ success: true, message: "Password reset successfully" });

  } catch (error) {
    console.error("[resetLawyerPassword] Error:", error.message, error);
    res.json({ success: false, message: error.message });
  }
};

// API to approve application and create lawyer account
const approveApplication = async (req, res) => {
  try {
    console.log("Approve application called with body:", req.body);
    const { applicationId } = req.body;

    // CRITICAL: Sanitize MongoDB ID
    const sanitizedId = sanitizeMongoId(applicationId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID format"
      });
    }

    const application = await applicationModel.findById(sanitizedId);
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

    // Delete application with sanitized ID
    await applicationModel.findByIdAndDelete(sanitizedId);
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

    // CRITICAL: Sanitize MongoDB ID
    const sanitizedId = sanitizeMongoId(applicationId);
    if (!sanitizedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID format"
      });
    }

    // Find the application first to get email for notification
    const application = await applicationModel.findById(sanitizedId);

    if (!application) {
      return res.json({
        success: false,
        message: "Application not found"
      });
    }

    // Send rejection email
    await sendRejectionEmail(
      application.application_email,
      application.application_name
    );

    // Delete the application with sanitized ID
    await applicationModel.findByIdAndDelete(sanitizedId);
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
    console.error("[rejectApplication] Error:", error.message, error);
    res.json({
      success: false,
      message: error.message || "Failed to reject application"
    });
  }
};

// Keep other functions the same...

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