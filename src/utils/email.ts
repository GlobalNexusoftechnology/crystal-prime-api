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