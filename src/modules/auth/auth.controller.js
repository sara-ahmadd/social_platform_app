import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  forgotPasswordService,
  getNewAccessToken,
  loginWithCredentials,
  loginWithGmail,
  regenerateOtpService,
  registerService,
  resetPasswordService,
  verifyEmailService,
} from "./auth.services.js";
import {
  forgotPasswordSchema,
  loginWithCredentialsSchema,
  loginWithGmailSchema,
  newTokenSchema,
  regenerateOtpSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation.js";
import { validate } from "../../middlewares/validateJoiSchema.js";

const router = Router();

//sign up endpoint
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(registerService)
);

//login with gmail endpoint
router.post(
  "/login_with_gmail",
  validate(loginWithGmailSchema),
  asyncHandler(loginWithGmail)
);

//get new access token
router.post(
  "/new_access_token",
  validate(newTokenSchema),
  asyncHandler(getNewAccessToken)
);

//login with credentials endpoint
router.post(
  "/login_with_credentials",
  validate(loginWithCredentialsSchema),
  asyncHandler(loginWithCredentials)
);

//verify email
router.post(
  "/verify_email",
  validate(verifyEmailSchema),
  asyncHandler(verifyEmailService)
);

//re-generate otp if the otp sent to user is expired
router.post(
  "/generate-otp",
  validate(regenerateOtpSchema),
  asyncHandler(regenerateOtpService)
);

//forgot password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(forgotPasswordService)
);

//reset password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(resetPasswordService)
);
export default router;
