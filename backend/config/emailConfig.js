import * as brevo from '@getbrevo/brevo';

// Configure Brevo API
let apiInstance = new brevo.TransactionalEmailsApi();

// Set API key
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Verify API key is loaded
console.log('🔑 Brevo API Key loaded:', process.env.BREVO_API_KEY ? 'YES ✅' : 'NO ❌');

// Note: The newer Brevo SDK doesn't expose apiClient.timeout directly
// Timeout and retry logic is handled internally by the SDK

// Helper function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send OTP Email for Verification
export const sendOTPEmail = async (recipientEmail, otp) => {
  console.log('📧 Attempting to send OTP email to:', recipientEmail);
  
  if (!isValidEmail(recipientEmail)) {
    console.error('❌ Invalid email address:', recipientEmail);
    return false;
  }
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "MML - Email Verification Code";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #6A0610; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Meet My Lawyer</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Email Verification</h2>
        <p style="font-size: 16px; color: #555;">
          Your verification code for lawyer registration is:
        </p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #6A0610;">
          <h1 style="color: #6A0610; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #666;">
          This code will expire in 10 minutes.
        </p>
        <p style="color: #d9534f; font-size: 14px;">
          <strong>Important:</strong> If you didn't request this code, please ignore this email.
        </p>
      </div>
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message from Meet My Lawyer</p>
      </div>
    </div>
  `;
  
  sendSmtpEmail.sender = { 
    name: "MML Team", 
    email: "yohanm.ranasingha@gmail.com"
  };
  
  sendSmtpEmail.to = [{ email: recipientEmail }];
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ OTP email sent successfully to:', recipientEmail);
    console.log('📨 Brevo Message ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response body:', error.response.body);
    }
    if (error.code) {
      console.error('📋 Error code:', error.code);
    }
    console.log('🔄 OTP Code (fallback):', otp);
    return false;
  }
};

// Send Approval/Welcome Email
export const sendApprovalEmail = async (recipientEmail, recipientName, password) => {
  console.log('📧 Sending approval email to:', recipientEmail);
  
  if (!isValidEmail(recipientEmail)) {
    console.error('❌ Invalid email address:', recipientEmail);
    return false;
  }
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Welcome to MML - Your Account Has Been Approved";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to MML, ${recipientName}!</h2>
      <p style="font-size: 16px; color: #555;">
        Your lawyer application has been approved. You can now sign in to your account using the credentials below.
      </p>
      <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Email:</strong> ${recipientEmail}</p>
        <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
      </div>
      <p style="color: #d9534f; font-size: 14px;">
        <strong>Important:</strong> Please change your password after your first login for security purposes.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5174/lawyer-login" 
           style="background-color: #007bff; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Sign In to Your Account
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 14px; color: #888;">
        Best regards,<br>
        MML Team
      </p>
    </div>
  `;
  
  sendSmtpEmail.sender = { 
    name: "MML Team", 
    email: "yohanm.ranasingha@gmail.com"
  };
  
  sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Approval email sent successfully to:', recipientEmail);
    console.log('📨 Brevo Message ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending approval email:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response body:', error.response.body);
    }
    console.log('=================================');
    console.log('APPLICATION APPROVED - EMAIL DETAILS (FALLBACK)');
    console.log('To:', recipientEmail);
    console.log('Name:', recipientName);
    console.log('Password:', password);
    console.log('Login URL: http://localhost:5174/lawyer-login');
    console.log('=================================');
    return false;
  }
};

// Send Welcome Email (alias for approval email)
export const sendWelcomeEmail = async (recipientEmail, recipientName, password) => {
  return await sendApprovalEmail(recipientEmail, recipientName, password);
};

// Send Rejection Email
export const sendRejectionEmail = async (recipientEmail, recipientName) => {
  console.log('📧 Sending rejection email to:', recipientEmail);
  
  if (!isValidEmail(recipientEmail)) {
    console.error('❌ Invalid email address:', recipientEmail);
    return false;
  }
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = "MML Application Status";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Application Status Update</h2>
      <p style="font-size: 16px; color: #555;">
        Dear ${recipientName},
      </p>
      <p style="font-size: 16px; color: #555;">
        Thank you for your interest in joining MML. After careful review of your application, 
        we regret to inform you that we are unable to approve your application at this time.
      </p>
      <p style="font-size: 16px; color: #555;">
        We appreciate the time you took to apply and encourage you to reapply in the future 
        if your circumstances change.
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 14px; color: #888;">
        Best regards,<br>
        MML Team
      </p>
    </div>
  `;
  
  sendSmtpEmail.sender = { 
    name: "MML Team", 
    email: "yohanm.ranasingha@gmail.com"
  };
  
  sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Rejection email sent successfully to:', recipientEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending rejection email:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response body:', error.response.body);
    }
    console.log('=================================');
    console.log('APPLICATION REJECTED - EMAIL DETAILS (FALLBACK)');
    console.log('To:', recipientEmail);
    console.log('Name:', recipientName);
    console.log('=================================');
    return false;
  }
};

// Send Bulk Email
export const sendBulkEmail = async (recipients, subject, messageContent) => {
  console.log(`📧 Attempting to send bulk email to ${recipients.length} recipient(s)`);
  console.log('📋 Recipients:', recipients);
  console.log('📋 Subject:', subject);
  
  // Validate inputs
  if (!Array.isArray(recipients) || recipients.length === 0) {
    console.error('❌ Invalid recipients array');
    return false;
  }
  
  // Filter out invalid emails
  const validEmails = recipients.filter(email => isValidEmail(email));
  if (validEmails.length === 0) {
    console.error('❌ No valid email addresses found');
    return false;
  }
  
  if (validEmails.length !== recipients.length) {
    console.warn(`⚠️ Filtered out ${recipients.length - validEmails.length} invalid email(s)`);
  }
  
  try {
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6A0610; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Meet My Lawyer</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            ${messageContent.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message from Meet My Lawyer Admin Panel</p>
        </div>
      </div>
    `;
    
    sendSmtpEmail.sender = { 
      name: "MML Admin", 
      email: "yohanm.ranasingha@gmail.com"
    };
    
    // Convert email array to Brevo format
    sendSmtpEmail.to = validEmails.map(email => ({ email: email.trim() }));
    
    console.log('📤 Sending request to Brevo...');
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Bulk email sent successfully to ${validEmails.length} recipient(s)`);
    console.log('📨 Brevo Message ID:', data.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Bulk email sending failed:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response body:', JSON.stringify(error.response.body, null, 2));
    }
    if (error.code) {
      console.error('📋 Error code:', error.code);
    }
    console.error('📋 Full error:', error);
    console.log('📋 Email would have been sent to:', validEmails);
    return false;
  }
};

// Send Email from Lawyer to Admin
export const sendEmailFromLawyer = async (adminEmail, subject, messageContent, lawyerName, lawyerEmail) => {
  console.log(`📧 Sending email from lawyer ${lawyerName} to admin`);
  
  if (!isValidEmail(adminEmail)) {
    console.error('❌ Invalid admin email address:', adminEmail);
    return false;
  }
  
  if (!isValidEmail(lawyerEmail)) {
    console.error('❌ Invalid lawyer email address:', lawyerEmail);
    return false;
  }
  
  try {
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `[Lawyer Message] ${subject}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6A0610; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Meet My Lawyer</h1>
          <p style="color: white; margin: 5px 0; font-size: 14px;">Message from Lawyer</p>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${lawyerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${lawyerEmail}</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message:</h3>
            ${messageContent.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This message was sent from the MML Lawyer Panel</p>
          <p>Reply directly to: ${lawyerEmail}</p>
        </div>
      </div>
    `;
    
    sendSmtpEmail.sender = { 
      name: lawyerName, 
      email: "yohanm.ranasingha@gmail.com"
    };
    
    sendSmtpEmail.to = [{ email: adminEmail, name: "Admin" }];
    
    // Set reply-to as lawyer's email
    sendSmtpEmail.replyTo = { email: lawyerEmail, name: lawyerName };
    
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to admin from lawyer: ${lawyerName}`);
    return true;
    
  } catch (error) {
    console.error('❌ Email sending to admin failed:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response body:', error.response.body);
    }
    return false;
  }
};