import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  addReplyService,
  createCommentService,
  deleteCommentService,
  likeUnlikeCommentService,
  updateCommentService,
} from "./comment.services.js";
import {
  addReplySchema,
  createCommentSchema,
  deleteCommentSchema,
  likeUnlikeCommentSchema,
  updateCommentSchema,
} from "./comment.validation.js";
import { validate } from "../../middlewares/validateJoiSchema.js";
import { uploadCloudinary } from "../../../utils/cloudUpload.js";

const router = Router({ mergeParams: true });

//create comment >>> /post/:id/comment
router.post(
  "/",
  asyncHandler(isAuthenticated),
  uploadCloudinary().single("image"),
  asyncHandler(validate(createCommentSchema)),
  asyncHandler(createCommentService)
);

//update comment >>> /post/:id/comment/update
router.patch(
  "/update/:commentId",
  asyncHandler(isAuthenticated),
  uploadCloudinary().single("image"),
  asyncHandler(validate(updateCommentSchema)),
  asyncHandler(updateCommentService)
);

//delete comment >>> /post/:id/comment/delete/:commentId by (comment owner / admin / post owner)
router.delete(
  "/delete/:commentId",
  asyncHandler(isAuthenticated),
  asyncHandler(validate(deleteCommentSchema)),
  asyncHandler(deleteCommentService)
);

//add a reply for a comment >>> /post/:id/comment/:commentId/add_reply
router.post(
  "/:commentId/add_reply",
  asyncHandler(isAuthenticated),
  uploadCloudinary().single("image"),
  asyncHandler(validate(addReplySchema)),
  asyncHandler(addReplyService)
);

//like_unlike comment
router.get(
  "/:commentId/like_unlike",
  asyncHandler(isAuthenticated),
  validate(likeUnlikeCommentSchema),
  asyncHandler(likeUnlikeCommentService)
);

export default router;
