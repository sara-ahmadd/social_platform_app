import { OAuth2Client } from "google-auth-library";
import { otpVerificationTemplate } from "../../../utils/email/otpVerifyEmail.js";
import { eventEmitter } from "../../../utils/email/sendEmail.js";
import { decrypt, encryptText } from "../../../utils/encryption.js";
import { compareHashedText, hashText } from "../../../utils/hashing.js";
import { OTPModel } from "../../models/otp.model.js";
import { providers, UserModel } from "../../models/user.model.js";
import otpGenerator from "otp-generator";
import { generateToken } from "../../../utils/generateToken.js";
import jwt from "jsonwebtoken";

const otpErrors = {
  notFound: "otp not found",
  blocked: "blocked",
  manyAttempts: "many attempts",
  invalid: "invalid",
};

/**
 * - handle sending otp to the email to be verified
 * @param {String} email
 */
export const sendOtp = async (email, subject) => {
  //generate redis instance
  //generate otp
  const otp = otpGenerator.generate(6, {
    digits: true,
    specialChars: false,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
  });
  const checkEmail = await OTPModel.findOne({ email });
  if (checkEmail) {
    checkEmail.otp = otp;
    await checkEmail.save();
  } else {
    // cretae otp to send to the email
    await OTPModel.create({ email, otp, attempts: 0 });
  }
  //send email contains otp to verify email
  eventEmitter.emit("sendEmail", email, subject, otpVerificationTemplate(otp));
};

/**
 *Check if the user already exists in DB
 * @param {String} email
 * @returns {*} If user exists return **user** and returns **null** if user doesnot exist
 */
export const checkUser = async (email = "") => {
  const user = await UserModel.findOne({ email });
  if (!user || user.isDeleted) {
    return null;
  }
  return user;
};
/**
 *
 * @param {String} otp
 * @param {String} email
 * @returns {String | null} error value in case of invalid otp or null in case of valid otp
 */
const verifyOtp = async (otp, email) => {
  //find the otp and the email attached to it
  const getOtp = await OTPModel.findOne({ email });

  if (!getOtp) return otpErrors.notFound;

  //get current time and check if it is less than blokTime of otp
  const currentTime = new Date().getTime();

  if (getOtp.blockTime !== null && currentTime <= getOtp.blockTime) {
    return otpErrors.blocked;
  }
  if (getOtp.blockTime !== null && currentTime > getOtp.blockTime) {
    //reset attempts
    getOtp.attempts = 0;
  }

  if (otp !== getOtp.otp) {
    //update value of attempts to be incremented with one
    getOtp.attempts = getOtp.attempts + 1;
    //save the updated attempts value
    await getOtp.save();
    if (getOtp.attempts + 1 === 6) {
      //save the limit time for block now + 5 mins
      getOtp.blockTime = currentTime + 5 * 60 * 1000; // Add 5 minutes (5 * 60 * 1000 ms)
      await getOtp.save();

      return otpErrors.manyAttempts;
    } else {
      return otpErrors.invalid;
    }
  }
  return null;
};

//Auth services
export const registerService = async (req, res, next) => {
  const { userName, email, password, confirmPassword, phone, DOB, gender } =
    req.body;
  //check that user email is not found and if found he must be soft-deleted
  const user = await checkUser(email);

  if (user && !user.isActivated) {
    await sendOtp(email, "Activation Email");
    return res.status(200).json({
      status: "Success",
      message: "activate your account",
    });
  }
  if (user && user.isActivated == true) {
    return next(new Error("User already exists", { cause: 400 }));
  }
  //hash pasword
  const hashedPassword = hashText(password);
  //encrypt phone
  const encryptedPhone = encryptText(phone);

  await sendOtp(email, "Account Activation");

  await UserModel.create({
    ...req.body,
    phone: encryptedPhone,
    password: hashedPassword,
  });
  return res.status(200).json({
    status: "Success",
    message: "Registered successfully",
  });
};
export const loginWithGmail = async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  const verify = async () => {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GMAIL_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  };

  const payload = await verify();
  const { email_verified, email, name } = payload;
  if (!email_verified) return next(new Error("Email is not verified"));
  //create user in the DB
  const user = await UserModel.create({
    email,
    userName: name,
    isActivated: email_verified,
    provider: providers.google,
  });
  const accessToken = generateToken(
    { id: user._id, email },
    process.env.ACCESS_EXPIRY_TIME
  );
  const refreshToken = generateToken(
    { id: user._id, email },
    process.env.REFRESH_EXPIRY_TIME
  );
  return res
    .status(200)
    .json({ status: "Success", data: { accessToken, refreshToken } });
};
export const loginWithCredentials = async (req, res, next) => {
  const { password, phone, email } = req.body;
  const user = await checkUser(email);
  if (!user) return next(new Error("User is not found", { cause: 404 }));
  if (password) {
    const comparePasswords = compareHashedText({
      plainText: password,
      hashedValue: user.password,
    });
    if (!comparePasswords)
      return next(new Error("Credentials are invalid", { cause: 400 }));
  }
  if (phone) {
    const decryptedUserPhone = decrypt({ cypherText: user.phone });
    if (decryptedUserPhone !== phone)
      return next(new Error("Credentials are invalid", { cause: 400 }));
  }
  const accessToken = generateToken(
    { id: user._id, email },
    process.env.ACCESS_EXPIRY_TIME
  );
  const refreshToken = generateToken(
    { id: user._id, email },
    process.env.REFRESH_EXPIRY_TIME
  );
  return res
    .status(200)
    .json({ status: "Success", data: { accessToken, refreshToken } });
};

export const verifyEmailService = async (req, res, next) => {
  const { otp, email } = req.body;
  const errorValue = await verifyOtp(otp, email, next);
  if (errorValue == otpErrors.notFound)
    return next(new Error("No otp found", { cause: 404 }));
  if (errorValue == otpErrors.blocked)
    return next(
      new Error("You are blocked, try again after 5 mins", { cause: 400 })
    );
  if (errorValue == otpErrors.manyAttempts)
    return next(
      new Error("Too many attempts. You are blocked for 5 minutes.", {
        cause: 400,
      })
    );
  if (errorValue == otpErrors.invalid)
    return next(new Error("Otp is invalid", { cause: 400 }));

  //if otp is correct activate the account associated with that email
  const user = await UserModel.findOne({ email });
  user.isActivated = true;
  await user.save();
  return res
    .status(200)
    .json({ status: "Success", message: "Email is verified successfully" });
};

export const regenerateOtpService = async (req, res, next) => {
  const { email } = req.body;
  await sendOtp(email, "Activation Email");
  return res.status(200).json({
    status: "Success",
    message: "activate your account",
  });
};

export const forgotPasswordService = async (req, res, next) => {
  const { email } = req.body;
  //check if user exists and is verified
  const user = await checkUser(email);
  if (!user.isActivated) {
    return next(new Error("Email is not verified."));
  }
  await sendOtp(email, "Reset Password");
  return res.status(200).json({
    status: "Success",
    message: "reset your password with the otp sent to your email now",
  });
};

export const resetPasswordService = async (req, res, next) => {
  const { otp, email, newPassword } = req.body;
  const errorValue = await verifyOtp(otp, email);
  if (errorValue == otpErrors.notFound)
    return next(new Error("No otp found", { cause: 404 }));
  if (errorValue == otpErrors.blocked)
    return next(
      new Error("You are blocked, try again after 5 mins", { cause: 400 })
    );
  if (errorValue == otpErrors.manyAttempts)
    return next(
      new Error("Too many attempts. You are blocked for 5 minutes.", {
        cause: 400,
      })
    );
  if (errorValue == otpErrors.invalid)
    return next(new Error("Otp is invalid", { cause: 400 }));

  //check if user exists
  const user = await checkUser(email);
  const hashedPassword = hashText(newPassword);
  user.password = hashedPassword;
  //save the last time in which password is updated
  user.changePasswordTimeStamp = new Date();

  //save updated user
  await user.save();
  return res.status(200).json({
    status: "Success",
    message: "Password is reset successfully",
  });
};

export const getNewAccessToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  //decode token to get its creation time and compare it with the last time password is updated
  const decodedToken = jwt.decode(refreshToken);
  //get user
  const user = await checkUser(decodedToken.email);
  if (!user) return next(new Error("User is not found", { cause: 404 }));
  const compareTimes =
    user.changePasswordTimeStamp.getTime() > decodedToken.iat * 1000; //convert it to milliseconds;

  if (compareTimes) {
    return next(new Error("you must login first", { cause: 404 }));
  }
  const accessToken = generateToken(
    { id: user._id, email: decodedToken.email },
    process.env.ACCESS_EXPIRY_TIME
  );
  return res.status(200).json({ status: "Success", token: accessToken });
};
