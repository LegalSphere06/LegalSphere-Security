import lawyerModel from "../models/lawyerModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import appointmentModel from "../models/appointmentModel.js";
import fs from 'node:fs';
import path from 'node:path';
import validator from 'validator';

const changeAvailability = async (req, res) => {
  try {
    const { lawyerId } = req.body;

    const lawyerData = await lawyerModel.findById(lawyerId);
    await lawyerModel.findByIdAndUpdate(lawyerId, {
      available: !lawyerData.available,
    });
    res.json({ success: true, message: "Availability Changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const lawyerList = async (req, res) => {
  try {
    const lawyers = await lawyerModel.find({}).select(["-password", "-email"]);

    // Add full URL to image paths
    const lawyersWithFullImageUrls = lawyers.map(lawyer => {
      const lawyerObj = lawyer.toObject();
      if (lawyerObj.image?.startsWith('/uploads/')) {
        // Prepend the backend URL to the image path
        const backendUrl = `${req.protocol}://${req.get('host')}`;
        lawyerObj.image = `${backendUrl}${lawyerObj.image}`;
      }
      return lawyerObj;
    });

    res.json({ success: true, lawyers: lawyersWithFullImageUrls });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for lawyer Login
const loginLawyer = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Sanitize inputs - prevent NoSQL injection----start
if (typeof email !== 'string' || typeof password !== 'string') {
  return res.json({ success: false, message: 'Invalid input format' });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.json({ success: false, message: 'Invalid email format' });
}
    // Sanitize inputs - prevent NoSQL injection----end

    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password are required' });
    }

    // Prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.json({ success: false, message: 'Invalid email or password format' });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" })
    }

    console.log('Login attempt for email:', email);

    const lawyer = await lawyerModel.findOne({ email: String(email) });

    if (!lawyer) {
      console.log('No lawyer found with email:', email);
      return res.json({ success: false, message: 'Invalid Credentials' });
    }

    console.log('Lawyer found:', lawyer.name);

    if (!lawyer.password) {
      console.log('Lawyer account found but no password set');
      return res.json({ success: false, message: 'Account not fully set up. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, lawyer.password);

    if (isMatch) {
      const token = jwt.sign({ id: lawyer._id }, process.env.JWT_SECRET);
      console.log('Login successful for:', lawyer.name);
      res.json({ success: true, token });
    } else {
      console.log('Password mismatch for:', lawyer.name);
      return res.json({ success: false, message: 'Invalid Credentials' });
    }

  } catch (error) {
    console.log('Login error:', error);
    res.json({ success: false, message: error.message });
  }
};

// API to get lawyer appointments for lawyer panel
const appointmentsLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.body; // Getting from req.body as set by middleware
    const appointments = await appointmentModel.find({ lawyerId: String(lawyerId) });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment completed for lawyer panel
const appointmentComplete = async (req, res) => {
  try {
    const { lawyerId, appointmentId } = req.body; // lawyerId from middleware

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.lawyerId == lawyerId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
      return res.json({ success: true, message: 'Appointment Completed' });
    } else {
      return res.json({ success: false, message: 'Mark Failed' });
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment cancel for lawyer panel
const appointmentCancel = async (req, res) => {
  try {
    const { lawyerId, appointmentId } = req.body; // lawyerId from middleware

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.lawyerId == lawyerId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
      return res.json({ success: true, message: 'Appointment Cancelled' });
    } else {
      return res.json({ success: false, message: 'Cancellation Failed' });
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for lawyer panel
const lawyerDashboard = async (req, res) => {
  try {
    const { lawyerId } = req.body; // Getting from req.body as set by middleware

    const appointments = await appointmentModel.find({ lawyerId: String(lawyerId) });

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
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get lawyer profile for lawyer panel
const lawyerProfile = async (req, res) => {
  try {
    const { lawyerId } = req.body; // Getting from req.body as set by middleware
    const profileData = await lawyerModel.findById(lawyerId).select('-password');

    res.json({ success: true, profileData });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



// API to update lawyer profile data from lawyer panel
const updateLawyerProfile = async (req, res) => {
  try {
    // Get lawyerId from body (set by middleware)

    let lawyerId;

    // Check if lawyerId exists in body (from middleware)
    if (req.body.lawyerId) {
      lawyerId = req.body.lawyerId;
    } else {
      // If not in body, try to decode from token again
      const { dtoken } = req.headers;
      const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
      lawyerId = token_decode.id;
    }

    console.log('Updating profile for lawyer:', lawyerId);
    console.log('Received body:', req.body);
    console.log('Received file:', req.file);

    // Build update object with all fields
    const updateData = {};

    // Handle text fields
    if (req.body.name) updateData.name = req.body.name;
    
    if (req.body.email) {
  if (typeof req.body.email !== 'string') {
    return res.json({ success: false, message: 'Invalid email format' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.json({ success: false, message: 'Invalid email format' });
  }
  updateData.email = req.body.email;
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

    // Handle array fields (split by comma)
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
        console.log('Error parsing address:', e);
        // If parsing fails, try to use it as is if it's an object
        if (typeof req.body.address === 'object') {
          updateData.address = req.body.address;
        }
      }
    }

    // Handle image upload
    if (req.file) {
      // Optional: Delete old image if exists
      try {
        const lawyer = await lawyerModel.findById(lawyerId);
        if (lawyer && lawyer.image) {
          // Handle both URL formats
          let oldImagePath;
          if (lawyer.image.startsWith('/uploads/')) {
            // If image path starts with /uploads/, construct full path
            oldImagePath = path.join(process.cwd(), lawyer.image.substring(1)); // Remove leading slash
          } else if (lawyer.image.startsWith('uploads/')) {
            // If image path starts with uploads/, construct full path
            oldImagePath = path.join(process.cwd(), lawyer.image);
          }

          if (oldImagePath && fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('Old image deleted:', oldImagePath);
          }
        }
      } catch (err) {
        console.log('Error deleting old image:', err);
      }

      // Set new image path - store with /uploads/ prefix for serving via Express static
      updateData.image = `/uploads/${req.file.filename}`;
      console.log('New image uploaded:', updateData.image);
    }

    console.log('Final update data:', updateData);

    // Update lawyer profile
    const updatedLawyer = await lawyerModel.findByIdAndUpdate(
      lawyerId,
      updateData,
      { new: true, runValidators: true, select: '-password' }
    );

    if (!updatedLawyer) {
      return res.json({ success: false, message: 'Lawyer not found' });
    }

    // Convert to object and add full URL to image path
    const updatedLawyerObj = updatedLawyer.toObject();
    if (updatedLawyerObj.image?.startsWith('/uploads/')) {
      const backendUrl = `${req.protocol}://${req.get('host')}`;
      updatedLawyerObj.image = `${backendUrl}${updatedLawyerObj.image}`;
    }

    res.json({
      success: true,
      message: 'Profile Updated Successfully',
      profileData: updatedLawyerObj
    });

  } catch (error) {
    console.log('Update error:', error);
    res.json({ success: false, message: error.message });
  }
};

// API to change lawyer password
const changePassword = async (req, res) => {
  try {
    const { lawyerId, currentPassword, newPassword } = req.body; // lawyerId from middleware

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

    if (newPassword.length < 6) {
      return res.json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await lawyerModel.findByIdAndUpdate(lawyerId, { password: hashedPassword });

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.log('Password change error:', error);
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

    // Get lawyer details to include in email
    const lawyer = await lawyerModel.findById(lawyerId).select('name email');

    if (!lawyer) {
      return res.json({ success: false, message: "Lawyer not found" });
    }

    // Import the email sending function
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
    console.error("Error sending email to admin:", error);
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

    // Basic URL validation
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
    console.error("Update online link error:", error);
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
  updateOnlineLink
};