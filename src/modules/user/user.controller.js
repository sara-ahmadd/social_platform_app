import { Router } from "express";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { decrypt } from "../../../utils/encryption.js";
import {
  addProfilePicture,
  getUserProfile,
  updateProfile,
  updatePasswordService,
  updateEmailService,
  verifyUpdateEmailService,
} from "./user.services.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validateJoiSchema.js";
import {
  addPictureSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateProfileSchema,
  verifyUpdateEmailSchema,
} from "./user.validation.js";
import { upload } from "../../../utils/uploadFiles.js";
const router = Router();

//get user profile
router.get("/", asyncHandler(isAuthenticated), asyncHandler(getUserProfile));

//update or add user picture
router.post(
  "/profile_pic",
  asyncHandler(isAuthenticated),
  upload("uploads").single("image"),
  // validate(addPictureSchema),
  asyncHandler(addProfilePicture)
);
//update user profile
router.patch(
  "/update_profile",
  asyncHandler(isAuthenticated),
  validate(updateProfileSchema),
  asyncHandler(updateProfile)
);

//delete profile picture

//change password
router.post(
  "/update_password",
  asyncHandler(isAuthenticated),
  validate(updatePasswordSchema),
  asyncHandler(updatePasswordService)
);

//update email
router.post(
  "/update_email",
  asyncHandler(isAuthenticated),
  validate(updateEmailSchema),
  asyncHandler(updateEmailService)
);

//verify updating email
router.post(
  "/verify_update_email",
  asyncHandler(isAuthenticated),
  validate(verifyUpdateEmailSchema),
  asyncHandler(verifyUpdateEmailService)
);

export default router;
