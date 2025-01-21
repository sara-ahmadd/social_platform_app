import joi from "joi";
import { genders } from "../../models/user.model.js";

const userFields = {
  userName: joi.string().min(3).max(30).messages({
    "string.base": "Username should be a type of text.",
    "string.empty": "Username cannot be empty.",
    "string.min": "Username should have a minimum length of 3 characters.",
    "string.max": "Username should have a maximum length of 30 characters.",
    "any.required": "Username is required.",
  }),
  password: joi
    .string()
    .pattern(/[a-zA-Z0-9]+($%&*@)?/)
    .messages({
      "string.pattern.base":
        "Password must include at least one lowercase letter, one uppercase letter, and one digit. Special characters ($%&*@) are optional.",
      "string.empty": "Password cannot be empty.",
      "any.required": "Password is required.",
    }),
  confirmPassword: joi.string().valid(joi.ref("password")).messages({
    "any.only": "Passwords do not match.",
    "any.required": "Confirm Password is required.",
  }),
  phone: joi.string().pattern(/^01[0125][0-9]{8}$/),
  email: joi.string().email().messages({
    "string.email": "Please enter a valid email address.",
    "string.empty": "Email cannot be empty.",
    "any.required": "Email is required.",
  }),
  DOB: joi.date().messages({
    "date.base": "Date of Birth should be a valid date.",
    "date.empty": "Date of Birth cannot be empty.",
    "any.required": "Date of Birth is required.",
  }),
  isDeleted: joi.boolean().messages({
    "boolean.base": "isDeleted should be a boolean value.",
  }),
  gender: joi
    .string()
    .valid(...Object.values(genders))
    .messages({
      "any.only": 'Gender must be either "male" or "female".',
      "string.empty": "Gender cannot be empty.",
      "any.required": "Gender is required.",
    }),
};

export const registerSchema = joi
  .object({
    userName: userFields.userName.required(),
    email: userFields.email.required(),
    password: userFields.password.required(),
    phone: userFields.phone.required(),
    confirmPassword: userFields.confirmPassword.required(),
    DOB: userFields.DOB.required(),
    gender: userFields.gender,
  })
  .required();

export const verifyEmailSchema = joi
  .object({
    email: userFields.email.required(),
    otp: joi.string().required().length(6).messages({
      "string.email": "Please enter a valid otp.",
      "string.empty": "otp cannot be empty.",
      "any.required": "otp is required.",
    }),
    attempts: joi.number().default(0),
  })
  .required();

export const regenerateOtpSchema = joi
  .object({
    email: userFields.email.required(),
  })
  .required();

export const forgotPasswordSchema = joi
  .object({
    email: userFields.email.required(),
  })
  .required();

export const loginWithGmailSchema = joi
  .object({
    idToken: joi.string().required().messages({
      "string.empty": "idToken cannot be empty.",
      "any.required": "idToken is required.",
    }),
  })
  .required();
export const newTokenSchema = joi
  .object({
    refreshToken: joi.string().required().messages({
      "string.empty": "refreshToken cannot be empty.",
      "any.required": "refreshToken is required.",
    }),
  })
  .required();

export const loginWithCredentialsSchema = joi
  .object({
    email: userFields.email.required(),
    password: userFields.password,
    phone: userFields.phone,
  })
  .xor("password", "phone") // Either password or phone must be provided, not both
  .required();

export const resetPasswordSchema = joi
  .object({
    email: userFields.email.required(),
    otp: joi.string().required().length(6).messages({
      "string.empty": "otp cannot be empty.",
      "any.required": "otp is required.",
    }),
    newPassword: joi
      .string()
      .pattern(/[a-zA-Z0-9]+($%&*@)?/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must include at least one lowercase letter, one uppercase letter, and one digit. Special characters ($%&*@) are optional.",
        "string.empty": "Password cannot be empty.",
        "any.required": "Password is required.",
      }),
    confirmNewPassword: joi
      .string()
      .valid(joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Passwords do not match.",
        "any.required": "Confirm Password is required.",
      }),
  })
  .required();
