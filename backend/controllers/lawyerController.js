import lawyerModel from "../models/lawyerModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import appointmentModel from "../models/appointmentModel.js";
import fs from 'fs';
import path from 'path';
import validator from 'validator';
import { validatePassword } from "../utils/passwordValidator.js";
import { initiateMFA } from "../utils/mfaService.js";

const changeAvailability = async (req, res) => {
  try {
    const { lawyerId } = req.body;

    const lawyerData = await lawyerModel.findById(lawyerId);
    await lawyerModel.findByIdAndUpdate(lawyerId, {
      available: !lawyerData.available,
    });
    res.json({ success: true, message: "Availability Changed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const lawyerList = async (req, res) => {
  try {
    const lawyers = await lawyerModel.find({}).select(["-password", "-email"]);

    const lawyersWithFullImageUrls = lawyers.map(lawyer => {
      const lawyerObj = lawyer.toObject();
      if (lawyerObj.image && lawyerObj.image.startsWith('/uploads/')) {
        const backendUrl = `${req.protocol}://${req.get('host')}`;
        lawyerObj.image = `${backendUrl}${lawyerObj.image}`;
      }
      return lawyerObj;
    });

    res.json({ success: true, lawyers: lawyersWithFullImageUrls });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API for lawyer Login
const loginLawyer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Type check - prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.json({ success: false, message: 'Invalid input format' });
    }

    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password are required' });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Invalid email format' });
    }

    const lawyer = await lawyerModel.findOne({ email: email.toLowerCase().trim() });

    if (!lawyer) {
      return res.json({ success: false, message: 'Invalid Credentials' });
    }

    if (!lawyer.password) {
      return res.json({ success: false, message: 'Account not fully set up. Please contact admin.' });
    }

    // Check account lockout
    if (lawyer.accountLockedUntil && lawyer.accountLockedUntil > new Date()) {
      const secondsLeft = Math.ceil((lawyer.accountLockedUntil - Date.now()) / 1000);
      return res.json({
        success: false,
        message: `Account is locked. Try again in ${secondsLeft} second(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, lawyer.password);

    if (!isMatch) {
      const attempts = (lawyer.failedLoginAttempts || 0) + 1;
      const update = { failedLoginAttempts: attempts };
      if (attempts >= 3) {
        update.accountLockedUntil = new Date(Date.now() + 30 * 1000);
        update.failedLoginAttempts = 0;
      }
      await lawyerModel.findByIdAndUpdate(lawyer._id, update);
      return res.json({ success: false, message: 'Invalid Credentials' });
    }

    // Reset failed attempts on successful login
    await lawyerModel.findByIdAndUpdate(lawyer._id, {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    });

    // MFA: send OTP if enabled
    if (lawyer.mfaEnabled !== false) {
      const mfaToken = await initiateMFA(lawyer._id.toString(), lawyer.email, "lawyer");
      return res.json({
        success: true,
        requiresMFA: true,
        mfaToken,
        message: "Verification code sent to your email.",
      });
    }

    const token = jwt.sign({ id: lawyer._id, role: "lawyer" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get lawyer appointments for lawyer panel
const appointmentsLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.body;

    // Type check - prevent NoSQL injection
    if (typeof lawyerId !== 'string') {
      return res.json({ success: false, message: 'Invalid input format' });
    }

    const appointments = await appointmentModel.find({ lawyerId });
    res.json({ success: true, appointments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment completed for lawyer panel
const appointmentComplete = async (req, res) => {
  try {
    const { lawyerId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.lawyerId == lawyerId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
      return res.json({ success: true, message: 'Appointment Completed' });
    } else {
      return res.json({ success: false, message: 'Mark Failed' });
    }

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment cancel for lawyer panel
const appointmentCancel = async (req, res) => {
  try {
    const { lawyerId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.lawyerId == lawyerId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
      return res.json({ success: true, message: 'Appointment Cancelled' });
    } else {
      return res.json({ success: false, message: 'Cancellation Failed' });
    }

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for lawyer panel
const lawyerDashboard = async (req, res) => {
  try {
    const { lawyerId } = req.body;

    // Type check - prevent NoSQL injection
    if (typeof lawyerId !== 'string') {
      return res.json({ success: false, message: 'Invalid input format' });
    }

    const appointments = await appointmentModel.find({ lawyerId });

    let earnings = 0;
    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let clients = [];
    appointments.map((item) => {
      if (!clients.includes(item.userId)) {
        clients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      clients: clients.length,
      latestAppointments: appointments.reverse().slice(0, 5)
    };

    res.json({ success: true, dashData });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get lawyer profile for lawyer panel
const lawyerProfile = async (req, res) => {
  try {
    const { lawyerId } = req.body;
    const profileData = await lawyerModel.findById(lawyerId).select('-password');
    res.json({ success: true, profileData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// API to update lawyer profile data from lawyer panel
const updateLawyerProfile = async (req, res) => {
  try {
    let lawyerId;

    if (req.body.lawyerId) {
      lawyerId = req.body.lawyerId;
    } else {
      const { dtoken } = req.headers;
      const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
      lawyerId = token_decode.id;
    }

    // Build update object with all fields
    const updateData = {};

    // Handle text fields
    if (req.body.name) updateData.name = req.body.name;

    // Email validation - prevent NoSQL injection
    if (req.body.email) {
      if (typeof req.body.email !== 'string') {
        return res.json({ success: false, message: 'Invalid email format' });
      }
      if (!validator.isEmail(req.body.email)) {
        return res.json({ success: false, message: 'Invalid email format' });
      }
      updateData.email = req.body.email.toLowerCase().trim();
    }

    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.office_phone) updateData.office_phone = req.body.office_phone;
    if (req.body.gender) updateData.gender = req.body.gender;
    if (req.body.dob) updateData.dob = req.body.dob;
    if (req.body.speciality) updateData.speciality = req.body.speciality;
    if (req.body.district) updateData.district = req.body.district;
    if (req.body.license_number) updateData.license_number = req.body.license_number;
    if (req.body.bar_association) updateData.bar_association = req.body.bar_association;
    if (req.body.experience) updateData.experience = req.body.experience;
    if (req.body.court1) updateData.court1 = req.body.court1;
    if (req.body.court2) updateData.court2 = req.body.court2;
    if (req.body.method) updateData.method = req.body.method;
    if (req.body.online_link) updateData.online_link = req.body.online_link;
    if (req.body.about) updateData.about = req.body.about;

    // Handle numeric fields
    if (req.body.fees !== undefined && req.body.fees !== '') {
      updateData.fees = Number(req.body.fees);
    }
    if (req.body.latitude !== undefined && req.body.latitude !== '') {
      updateData.latitude = Number(req.body.latitude);
    }
    if (req.body.longitude !== undefined && req.body.longitude !== '') {
      updateData.longitude = Number(req.body.longitude);
    }

    // Handle boolean field
    if (req.body.available !== undefined) {
      updateData.available = req.body.available === 'true' || req.body.available === true;
    }

    // Handle array fields
    if (req.body.degree) {
      updateData.degree = req.body.degree.split(',').map(item => item.trim()).filter(item => item);
    }
    if (req.body.legal_professionals) {
      updateData.legal_professionals = req.body.legal_professionals.split(',').map(item => item.trim()).filter(item => item);
    }
    if (req.body.languages_spoken) {
      updateData.languages_spoken = req.body.languages_spoken.split(',').map(item => item.trim()).filter(item => item);
    }

    // Handle JSON fields
    if (req.body.address) {
      try {
        updateData.address = JSON.parse(req.body.address);
      } catch (e) {
        if (typeof req.body.address === 'object') {
          updateData.address = req.body.address;
        }
      }
    }

    // Handle image upload
    if (req.file) {
      try {
        const lawyer = await lawyerModel.findById(lawyerId);
        if (lawyer && lawyer.image) {
          let oldImagePath;
          if (lawyer.image.startsWith('/uploads/')) {
            oldImagePath = path.join(process.cwd(), lawyer.image.substring(1));
          } else if (lawyer.image.startsWith('uploads/')) {
            oldImagePath = path.join(process.cwd(), lawyer.image);
          }
          if (oldImagePath && fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      } catch (err) {
        console.log('Error deleting old image:', err);
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    // Update lawyer profile
    const updatedLawyer = await lawyerModel.findByIdAndUpdate(
      lawyerId,
      updateData,
      { new: true, runValidators: true, select: '-password' }
    );

    if (!updatedLawyer) {
      return res.json({ success: false, message: 'Lawyer not found' });
    }

    const updatedLawyerObj = updatedLawyer.toObject();
    if (updatedLawyerObj.image && updatedLawyerObj.image.startsWith('/uploads/')) {
      const backendUrl = `${req.protocol}://${req.get('host')}`;
      updatedLawyerObj.image = `${backendUrl}${updatedLawyerObj.image}`;
    }

    res.json({
      success: true,
      message: 'Profile Updated Successfully',
      profileData: updatedLawyerObj
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to change lawyer password
const changePassword = async (req, res) => {
  try {
    const { lawyerId, currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.json({ success: false, message: 'Both passwords are required' });
    }

    const lawyer = await lawyerModel.findById(lawyerId);
    if (!lawyer) {
      return res.json({ success: false, message: 'Lawyer not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, lawyer.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Current password is incorrect' });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) {
      return res.json({ success: false, message: pwCheck.message });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await lawyerModel.findByIdAndUpdate(lawyerId, { password: hashedPassword });

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to send email to admin from lawyer panel
const sendEmailToAdmin = async (req, res) => {
  try {
    const { lawyerId, subject, message } = req.body;

    if (!subject || !message) {
      return res.json({ success: false, message: "Subject and message are required" });
    }

    const lawyer = await lawyerModel.findById(lawyerId).select('name email');
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    const { sendEmailFromLawyer } = await import('../config/simpleEmail.js');

    const adminEmail = process.env.ADMIN_EMAIL;
    const emailSent = await sendEmailFromLawyer(
      adminEmail,
      subject,
      message,
      lawyer.name,
      lawyer.email
    );

    if (emailSent) {
      res.json({ success: true, message: "Email sent to admin successfully" });
    } else {
      res.json({ success: false, message: "Failed to send email. Please try again." });
    }

  } catch (error) {
    res.json({ success: false, message: error.message || "Server error occurred" });
  }
};

// API to update lawyer online meeting link
const updateOnlineLink = async (req, res) => {
  try {
    const { lawyerId, online_link } = req.body;

    if (!online_link) {
      return res.json({ success: false, message: "Meeting link is required" });
    }

    try {
      new URL(online_link);
    } catch {
      return res.json({ success: false, message: "Please provide a valid URL" });
    }

    const updatedLawyer = await lawyerModel.findByIdAndUpdate(
      lawyerId,
      { online_link },
      { new: true, select: '-password' }
    );

    if (!updatedLawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    res.json({
      success: true,
      message: "Online meeting link updated successfully",
      profileData: updatedLawyer
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to toggle MFA on/off for lawyer
const toggleMFA = async (req, res) => {
  try {
    const { lawyerId } = req.body;
    const lawyer = await lawyerModel.findById(lawyerId);
    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    const newMfaStatus = !lawyer.mfaEnabled;
    await lawyerModel.findByIdAndUpdate(lawyerId, { mfaEnabled: newMfaStatus });

    res.json({
      success: true,
      mfaEnabled: newMfaStatus,
      message: `Two-factor authentication ${newMfaStatus ? "enabled" : "disabled"} successfully.`,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  changeAvailability,
  lawyerList,
  loginLawyer,
  appointmentsLawyer,
  appointmentCancel,
  appointmentComplete,
  lawyerDashboard,
  lawyerProfile,
  updateLawyerProfile,
  changePassword,
  sendEmailToAdmin,
  updateOnlineLink,
  toggleMFA
};