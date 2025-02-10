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
  getUserByIdService,
  deleteProfilePicService,
  blockUserService,
  sendFriendRequestService,
  acceptOrRejectFriendRequestService,
  cancelFriendRequestService,
} from "./user.services.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validateJoiSchema.js";
import {
  acceptOrRejectFriendRequestSchema,
  addPictureSchema,
  blockUserValidation,
  cancelFriendRequestSchema,
  sendFriendRequestSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateProfileSchema,
  verifyUpdateEmailSchema,
} from "./user.validation.js";
import { upload } from "../../../utils/uploadFiles.js";
const router = Router();

//get user profile for the user himself, admin
router.get("/", asyncHandler(isAuthenticated), asyncHandler(getUserProfile));

//view another user's acount
router.get(
  "/user_by_id/:userId",
  asyncHandler(isAuthenticated),
  asyncHandler(getUserByIdService)
);
//update or add user picture
router.post(
  "/profile_pic",
  asyncHandler(isAuthenticated),
  upload("uploads").single("image"),
  validate(addPictureSchema),
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
router.delete(
  "/delete_profile_pic",
  asyncHandler(isAuthenticated),
  asyncHandler(deleteProfilePicService)
);
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

//block user
router.get(
  "/block_unblock/:userId",
  asyncHandler(isAuthenticated),
  validate(blockUserValidation),
  asyncHandler(blockUserService)
);

//send friend request to a user
router.post(
  "/send_request",
  asyncHandler(isAuthenticated),
  validate(sendFriendRequestSchema),
  asyncHandler(sendFriendRequestService)
);
//cancel friend request to a user
router.post(
  "/cancel_request",
  asyncHandler(isAuthenticated),
  validate(cancelFriendRequestSchema),
  asyncHandler(cancelFriendRequestService)
);

//accept or reject friend request
router.get(
  "/accept_reject_request",
  validate(acceptOrRejectFriendRequestSchema),
  asyncHandler(acceptOrRejectFriendRequestService)
);
export default router;
