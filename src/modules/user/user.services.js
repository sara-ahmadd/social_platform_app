import { friendRequestTemplate } from "../../../utils/email/friendRequestEmail.js";
import { notificationTemplate } from "../../../utils/email/notificationEmail.js";
import { eventEmitter } from "../../../utils/email/sendEmail.js";
import { decrypt, encryptText } from "../../../utils/encryption.js";
import { generateToken, verifyToken } from "../../../utils/generateToken.js";
import { compareHashedText, hashText } from "../../../utils/hashing.js";
import { checkFriends } from "../../../utils/helpers/checkFriends.js";

import { defaultPicture, UserModel } from "../../models/user.model.js";
import { friendRequestState } from "./user.validation.js";

export const getUserProfile = async (req, res, next) => {
  //decrypt user phone
  const { user } = req;
  const decryptedPhone = decrypt({ cypherText: user.phone });
  return res.status(200).json({
    status: "Success",
    user: {
      userName: user.userName,
      email: user.email,
      phone: decryptedPhone,
      picture: user.picture,
      gender: user.gender,
      DOB: user.DOB,
      _id: user._id,
    },
  });
};

export const getUserByIdService = async (req, res, next) => {
  const { userId } = req.params;
  const viewer = req.user;

  //check if the user is in blocked users array of the profile to be displayed
  const currentUser = await UserModel.findById(userId);
  if (currentUser.blocked_users.includes(viewer._id)) {
    return next(new Error("You are blocked"));
  }

  const views = await UserModel.findById(userId)
    .populate("views", "userName picture")
    .select("views -_id")
    .exec();

  const user = await UserModel.findById(userId);
  if (!user) return next(new Error("User not found"));
  //add the id of  the current viewer
  user.views.push(viewer._id);
  if (user.views.length === 6) {
    //send email to tell the user the number of views
    eventEmitter.emit(
      "sendEmail",
      user.email,
      "Notifications",
      notificationTemplate(viewer.userName)
    );
    user.views.shift();
  }
  await user.save();

  return res.status(200).json({
    status: "Success",
    user: {
      userName: user.userName,
      picture: user.picture,
      email: user.email,
      _id: user._id,
    },
  });
};

export const addProfilePicture = async (req, res, next) => {
  const userId = req.user._id,
    filePath = req.file.path;
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      picture: `${process.env.BASE_URL}/${filePath}`,
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

export const deleteProfilePicService = async (req, res, next) => {
  const { user } = req;
  await UserModel.findByIdAndUpdate(user._id, {
    picture: defaultPicture,
  });
  return res
    .status(200)
    .json({ status: "Success", message: "Picture deleted successfully" });
};

export const blockUserService = async (req, res, next) => {
  //get id of targetted user
  const { userId } = req.params;
  const { user } = req;
  //check if that user is already in blocked users list
  const currentUser = await UserModel.findById(user._id);
  let blocked = false;
  if (!currentUser.blocked_users.includes(userId)) {
    currentUser.blocked_users.push(userId);
    blocked = true;
  } else {
    blocked = false;
    currentUser.blocked_users = currentUser.blocked_users.filter(
      (u) => u.toString() !== userId.toString()
    );
  }
  await currentUser.save();

  const blockedList = await UserModel.findById(user._id)
    .select("blocked_users -_id")
    .populate("blocked_users", "userName email picture");

  return res.status(200).json({
    status: "Success",
    message: !blocked ? "unblocked successfully" : "blocked successfully",
    blockedList: [...blockedList.blocked_users],
  });
};

export const sendFriendRequestService = async (req, res, next) => {
  //get targetted email from request body
  const { email } = req.body;
  //get current user id (owner)
  const { user } = req;
  if (user.email === email)
    return next(new Error("you cannot send friend request to your self!"));
  //get the target user & add current user id to targets's friendRequest array
  const targetUser = await UserModel.findOne({ email });
  //generate token to get target user email&id to send it in the email
  const token = generateToken(
    { id: targetUser._id, email: targetUser.email },
    "1h"
  );

  //check if current and traget users are already friends or sent friend requests to eachother before
  checkFriends(targetUser, user, next);

  //send email to tagret user to inform him that current user sent him a friend request
  eventEmitter.emit(
    "sendEmail",
    email,
    "Friend Request Email",
    friendRequestTemplate(user.email, token)
  );
  //add current user to friend_request array of the target user
  targetUser.friend_requests.push(user._id);
  await targetUser.save();

  return res
    .status(200)
    .json({ status: "Success", message: "Friend request sent successfully" });
};

export const cancelFriendRequestService = async (req, res, next) => {
  //get targetted email from request body
  const { email } = req.body;
  //get current user id (owner)
  const { user } = req;
  //get the target user & add current user id to targets's friendRequest array
  const targetUser = await UserModel.findOne({ email });
  //check if he is in target users friend already
  if (targetUser.friends.includes(user._id))
    return next(
      new Error(`you are already a frind with ${email}`, { cause: 400 })
    );
  //check if he is in target users friend requests already
  if (!targetUser.friend_requests.includes(user._id))
    return next(
      new Error(`you didnot send a friend request to ${email}`, { cause: 400 })
    );

  //remove current user to friend_request array of the target user
  targetUser.friend_requests = targetUser.friend_requests.filter(
    (u) => u.toString() !== user._id.toString()
  );
  await targetUser.save();

  return res.status(200).json({
    status: "Success",
    message: "Friend request is cancelled successfully",
  });
};

export const acceptOrRejectFriendRequestService = async (req, res, next) => {
  //get sender email from query params
  //get status (accept/reject) from query params
  const { state, email, token } = req.query;
  const senderUser = await UserModel.findOne({ email });

  console.log(email);
  //get current user
  const userData = verifyToken(token);
  console.log(userData.email);

  const currentUser = await UserModel.findById(userData.id);

  //check if the sender is still in friend_request array
  if (!currentUser.friend_requests.includes(senderUser._id))
    return next(new Error("the friend request is cancelled"));

  //if accept? add user in friends array , else? remove user from friend_request array
  if (state === friendRequestState.accept) {
    currentUser.friends.push(senderUser._id);
  }
  //in both states we remove user from friend_requests
  currentUser.friend_requests = currentUser.friend_requests.filter(
    (u) => u.toString() !== senderUser._id.toString()
  );
  await currentUser.save();
  return res.status(200).json({
    status: "Success",
    message:
      state === friendRequestState.accept
        ? "You are now friends✔"
        : "friend request is rejected successfully",
  });
};
