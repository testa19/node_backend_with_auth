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

export default class Email {
  #firstName: string;
  #to: string;
  #from: string;
  constructor(private user: Prisma.UserCreateInput, private url: string) {
    this.#firstName = user.name ? (user.name.split(" ")[0] as string) : "User";
    this.#to = user.email!;
    this.#from = `Service <admin@first.com>`;
  }

  private newTransport() {
    // if (process.env.NODE_ENV === 'production') {
    //   console.log('Hello')
    // }

    // return nodemailer.createTransport({
    //   ...smtp,
    //   auth: {
    //     user: smtp.user,
    //     pass: smtp.pass,
    //   },
    // });

    return nodemailer.createTransport({
      ...smtp,
      ignoreTLS: true,
    });
  }

  private async send(template: string, subject: string) {
    // Generate HTML template based on the template string
    const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
      firstName: this.#firstName,
      subject,
      url: this.url,
    });
    // Create mailOptions
    const mailOptions = {
      from: this.#from,
      to: this.#to,
      subject,
      text: convert(html),
      html,
    };

    // Send email
    const info = await this.newTransport().sendMail(mailOptions);
    console.log(nodemailer.getTestMessageUrl(info));
  }

  async sendVerificationCode() {
    await this.send("verificationCode", "Your account verification code");
  }

  async sendPasswordResetToken() {
    await this.send(
      "resetPassword",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
}
