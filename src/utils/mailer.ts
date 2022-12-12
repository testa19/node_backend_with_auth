import nodemailer from "nodemailer";
import pug from "pug";
import { convert } from "html-to-text";
import { Prisma } from "@prisma/client";
import { env } from "process";

import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const smtp = {
  host: env.MAIL_HOST,
  port: Number(env.MAIL_PORT),
  user: env.MAIL_USER,
  pass: env.MAIL_PASS,
};

export interface MailInterface {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html: string;
}

const from = `Service <admin@first.com>`;

const template = (template: string, options: Object) => {
  return pug.renderFile(`${__dirname}/../views/${template}.pug`, {
    ...options,
  });
};

export const sendEmail = async (
  options: MailInterface,
  transporter: "ethereal" | "mailcatcher" = "mailcatcher"
) => {
  // if (process.env.NODE_ENV === 'production') {
  //   console.log('Hello')
  // }

  let transport;
  if (transporter === "ethereal") {
    transport = nodemailer.createTransport({
      ...smtp,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
  } else {
    transport = nodemailer.createTransport({
      ...smtp,
      ignoreTLS: true,
    });
  }

  // Create mailOptions
  const mailOptions = {
    from: `"First" ${env.SMTP_SENDER || from}`,
    to: options.to,
    subject: options.subject,
    text: convert(options.html),
    html: options.html,
  };

  const info = await transport.sendMail(mailOptions);

  console.log(`Mail sent successfully!!`);
  console.log(`[MailResponse]=${info.response} [MessageID]=${info.messageId}`);
  if (env.NODE_ENV === "development" && transporter === "ethereal") {
    console.log(
      `Nodemailer ethereal URL: ${nodemailer.getTestMessageUrl(info)}`
    );
  }

  return info;
};

// Mailers

export const sendVerificationCode = (
  user: Prisma.UserCreateInput,
  options: { url: string }
) => {
  const firstName = user.name ? (user.name.split(" ")[0] as string) : "User";
  const subject = "Your account verification code";
  const to = user.email!;
  const html = template("verificationCode", { subject, firstName, ...options });

  return sendEmail({ to, subject, html });
};

export const sendPasswordResetToken = (
  user: Prisma.UserCreateInput,
  options: { url: string }
) => {
  const firstName = user.name ? (user.name.split(" ")[0] as string) : "User";
  const subject = "Your password reset token (valid for only 10 minutes)";
  const to = user.email!;
  const html = template("resetPassword", { subject, firstName, ...options });

  return sendEmail({ to, subject, html });
};
