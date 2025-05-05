import * as sib from "sib-api-v3-sdk";
import AppError from "./appError";

const sendEmail = async (
  toEmail: string,
  templateId: number,
  params: object
) => {
  try {
    const apiKey = process.env.BREVO_API_KEY_EMAIL;
    if (!apiKey) throw new AppError(404,"Brevo API key not found");

    const client = sib.ApiClient.instance;
    const apiKeyInstance = client.authentications["api-key"];
    apiKeyInstance.apiKey = apiKey;

    const emailApi = new sib.TransactionalEmailsApi();

    const sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    };
    const receivers = [{ email: toEmail }];

    const sendSmtpEmail = {
      sender,
      to: receivers,
      templateId,
      params
    };
    const resEmail = await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log("resEmail", resEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export { sendEmail };
