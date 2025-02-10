import joi from "joi";
import { userFields } from "../auth/auth.validation.js";

export const roles = {
  user: "user",
  admin: "admin",
};

export const friendRequestState = {
  accept: "accept",
  reject: "reject",
};

export const fileObject = {
  fieldname: joi.string().required(),
  filename: joi.string().required(),
  path: joi.string().required(),
  size: joi.number().required(),
  destination: joi.string().required(),
  originalname: joi.string().required(),
  encoding: joi.string().required(),
  mimetype: joi.string().required(),
};

export const addPictureSchema = joi
  .object({
    file: joi.object(fileObject).required(),
  })
  .required();

export const updateProfileSchema = joi
  .object({
    userName: userFields.userName,
    phone: userFields.phone,
    DOB: userFields.DOB,
    gender: userFields.gender,
  })
  .required()
  .or("userName", "phone", "DOB", "gender");

export const updatePasswordSchema = joi
  .object({
    email: userFields.email.required(),
    oldPassword: joi
      .string()
      .pattern(/[a-zA-Z0-9]+($%&*@)?/)
      .required(),
    newPassword: joi
      .string()
      .pattern(/[a-zA-Z0-9]+($%&*@)?/)
      .required(),
    confirmNewPassword: joi.string().valid(joi.ref("newPassword")).required(),
  })
  .required();

export const updateEmailSchema = joi
  .object({
    email: userFields.email.required(),
  })
  .required();

export const verifyUpdateEmailSchema = joi
  .object({
    otp: joi.string().length(6).required(),
    email: userFields.email.required(),
  })
  .required();

export const blockUserValidation = joi
  .object({
    userId: joi.string().required(),
  })
  .required();

export const sendFriendRequestSchema = joi
  .object({
    email: userFields.email.required(),
  })
  .required();

export const cancelFriendRequestSchema = joi
  .object({
    email: userFields.email.required(),
  })
  .required();

export const acceptOrRejectFriendRequestSchema = joi
  .object({
    email: userFields.email.required(),
    token: joi.string().required(),
    state: joi
      .string()
      .valid(...Object.values(friendRequestState))
      .required(),
  })
  .required();
