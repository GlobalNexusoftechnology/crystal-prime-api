// import * as sib from "sib-api-v3-sdk";
// import AppError from "./appError";

// const sendEmail = async (
//   toEmail: string,
//   templateId: number,
//   params: object
// ) => {
//   try {
//     const apiKey = process.env.BREVO_API_KEY_EMAIL;
//     if (!apiKey) throw new AppError(404,"Brevo API key not found");

//     const client = sib.ApiClient.instance;
//     const apiKeyInstance = client.authentications["api-key"];
//     apiKeyInstance.apiKey = apiKey;

//     const emailApi = new sib.TransactionalEmailsApi();

//     const sender = {
//       email: process.env.BREVO_SENDER_EMAIL,
//       name: process.env.BREVO_SENDER_NAME,
//     };
//     const receivers = [{ email: toEmail }];

//     const sendSmtpEmail = {
//       sender,
//       to: receivers,
//       templateId,
//       params
//     };
//     const resEmail = await emailApi.sendTransacEmail(sendSmtpEmail);
//     console.log("resEmail", resEmail);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };

// export { sendEmail };


import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // or your SMTP provider
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

export const sendForgotPasswordMail = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h3>Password Reset</h3>
      <p>Use the following OTP to reset your password:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 5 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendTicketCommentEmail = async (
  email: string, 
  commenterName: string, 
  ticketTitle: string, 
  commentTitle: string, 
  commentDescription: string, 
  ticketId: string
) => {
  const mailOptions = {
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Comment on Ticket: ${ticketTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Comment on Your Ticket</h2>
        <p>Hello,</p>
        <p><strong>${commenterName}</strong> has added a new comment to the ticket:</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
            Ticket: ${ticketTitle}
          </h3>
          
          ${commentTitle ? `
            <div style="margin: 15px 0;">
              <strong style="color: #555;">Comment Title:</strong>
              <p style="margin: 5px 0 0 0; color: #333; font-size: 16px;">${commentTitle}</p>
            </div>
          ` : ''}
          
          ${commentDescription ? `
            <div style="margin: 15px 0;">
              <strong style="color: #555;">Comment Description:</strong>
              <div style="background: white; padding: 15px; border-radius: 3px; border: 1px solid #eee; margin-top: 5px;">
                <p style="margin: 0; color: #666; line-height: 1.5;">${commentDescription}</p>
              </div>
            </div>
          ` : ''}
        </div>
        
        <p>You can view this ticket and respond by logging into your account.</p>
        
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">
            <strong>Ticket ID:</strong> ${ticketId}
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};