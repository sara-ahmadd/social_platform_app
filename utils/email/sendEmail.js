import EventEmitter from "node:events";
import nodemailer from "nodemailer";

export const eventEmitter = new EventEmitter();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASS,
  },
});

export const sendEmail = async (email, subject, html) => {
  await transporter.sendMail({
    from: `"Social Platform Application 👋" <${process.env.SENDER_EMAIL}>`, // sender address
    to: email, // list of receivers
    subject, // Subject line
    html,
  });
};
eventEmitter.on("sendEmail", sendEmail);
