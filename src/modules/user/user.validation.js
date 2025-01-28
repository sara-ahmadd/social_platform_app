import joi from "joi";
import { userFields } from "../auth/auth.validation.js";

export const roles = {
  user: "user",
  admin: "admin",
};

const fileObject = {
  fieldname: joi.string(),
  originalname: joi.string(),
  encoding: joi.string(),
  mimetype: joi.string(),
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
