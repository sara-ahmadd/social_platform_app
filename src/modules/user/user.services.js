import { decrypt, encryptText } from "../../../utils/encryption.js";
import { compareHashedText, hashText } from "../../../utils/hashing.js";
import { OTPModel } from "../../models/otp.model.js";
import { UserModel } from "../../models/user.model.js";
import { sendOtp } from "../auth/auth.services.js";

export const getUserProfile = (req, res, next) => {
  //decrypt user phone
  const { user } = req;
  delete user.password;
  const decryptedPhone = decrypt({ cypherText: user.phone });
  return res.status(200).json({
    status: "Success",
    user: {
      userName: user.userName,
      email: user.email,
      phone: decryptedPhone,
      picture: `${process.env.BASE_URL}/${user.picture}`,
      gender: user.gender,
      DOB: user.DOB,
    },
  });
};

export const addProfilePicture = async (req, res, next) => {
  const userId = req.user._id,
    filePath = req.file.path;
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      picture: filePath,
    },
    { new: true }
  )
    .select("-password")
    .lean();
  return res
    .status(200)
    .json({ status: "Success", message: "picture updated successfully", user });
};

export const updateProfile = async (req, res, next) => {
  const userId = req.user._id;

  await UserModel.findByIdAndUpdate(
    userId,
    {
      ...req.body,
      phone: req.body.phone ? encryptText(req.body.phone) : req.user.phone,
    },
    { new: true }
  );
  return res.status(200).json({
    status: "Success",
    message: "User data updated",
  });
};

export const updatePasswordService = async (req, res, next) => {
  const { user } = req;
  const { newPassword, email, oldPassword } = req.body;
  //make sure that the user that is changing the password is the same whose token is authenticated
  if (user.email !== email)
    return next(
      new Error("You arenot authorized to update password of this profile", {
        cause: 400,
      })
    );

  const checkUser = await UserModel.findOne({ email });

  const verifyOldPass = compareHashedText({
    plainText: oldPassword,
    hashedValue: checkUser.password,
  });
  if (!verifyOldPass)
    return next(new Error("Old password is invalid", { cause: 400 }));

  const currDateTime = new Date().getTime();
  checkUser.changePasswordTimeStamp = currDateTime;

  const hashedPass = hashText(newPassword);
  checkUser.password = hashedPass;
  await checkUser.save();
  return res
    .status(200)
    .json({ status: "Success", message: "Password is updated successfully" });
};

export const updateEmailService = async (req, res, next) => {
  //get the user from the req
  const { user } = req;
  const { email } = req.body;
  //save the new email in the key : tempEmail
  await UserModel.findByIdAndUpdate(user._id, { tempEmail: email });
  //send otp to the user to verify that action (updating email)
  await sendOtp(user.email, "Verify updating your email");
  return res.status(200).json({
    status: "Success",
    message: "otp is sent to your email to verify updating action",
  });
};
export const verifyUpdateEmailService = async (req, res, next) => {
  //get the user from the req
  const { user } = req;
  const { otp, email } = req.body;

  const checkOtp = await OTPModel.findOne({ otp, email });
  if (checkOtp) return next(new Error("otp is invalid", { cause: 400 }));

  //check that email is not already exist (the new email is saved in tempEmail)
  const checkEmail = await UserModel.findOne({ email: user.tempEmail });
  if (checkEmail)
    return next(new Error("Email already exists", { cause: 400 }));

  await UserModel.findByIdAndUpdate(user._id, {
    email: user.tempEmail,
    tempEmail: null,
  });
  return res
    .status(200)
    .json({ status: "Success", message: "Email is updated successfully" });
};
