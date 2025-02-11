import { Router } from "express";
import { asyncHandler } from "./../../../utils/asyncHandler.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  archivePostService,
  createPostService,
  deletePostService,
  getALLPostsOfSpecificUser,
  getALLPostsService,
  getPostByIdService,
  likeUnlikePostService,
  undoPostService,
  updatePostService,
} from "./post.services.js";
import { validate } from "../../middlewares/validateJoiSchema.js";
import {
  createPostValidation,
  deletePostSchema,
  getAllPostsOfSpecificUserValidation,
  getAllPostsValidation,
  getPostByIdSchema,
  likeUnlikePostSchema,
  undoPostSchema,
  updatePostValidation,
} from "./post.validation.js";
import { uploadCloudinary } from "../../../utils/cloudUpload.js";
import commentRouter from "./../comment/comment.controller.js";

const router = Router();

//use comment router here
router.use("/:id/comment", commentRouter);

//create post
router.post(
  "/",
  asyncHandler(isAuthenticated),
  uploadCloudinary().array("images"),
  validate(createPostValidation),
  asyncHandler(createPostService)
);
//get all posts (active/deleted/all)
router.get(
  "/all",
  asyncHandler(isAuthenticated),
  validate(getAllPostsValidation),
  asyncHandler(getALLPostsService)
);
//get all posts of a specific user by his id
router.get(
  "/all/:userId",
  asyncHandler(isAuthenticated),
  validate(getAllPostsOfSpecificUserValidation),
  asyncHandler(getALLPostsOfSpecificUser)
);

//update post
router.patch(
  "/update/:id",
  asyncHandler(isAuthenticated),
  uploadCloudinary().array("images"),
  validate(updatePostValidation),
  asyncHandler(updatePostService)
);

//get post by id -- open api for owner/viewr/admin
router.get(
  "/post_by_id/:id",
  asyncHandler(isAuthenticated),
  validate(getPostByIdSchema),
  asyncHandler(getPostByIdService)
);

//undo post by id by owner within 2 mins of its creation
router.delete(
  "/undo/:id",
  asyncHandler(isAuthenticated),
  validate(undoPostSchema),
  asyncHandler(undoPostService)
);
//soft-delete post by id by owner & admin
router.delete(
  "/delete/:id",
  asyncHandler(isAuthenticated),
  validate(deletePostSchema),
  asyncHandler(deletePostService)
);
//archive post by id by owner & admin
router.get(
  "/archive/:id",
  asyncHandler(isAuthenticated),
  validate(deletePostSchema),
  asyncHandler(archivePostService)
);

//like_unlike posts
router.get(
  "/like_unlike/:postId",
  asyncHandler(isAuthenticated),
  validate(likeUnlikePostSchema),
  asyncHandler(likeUnlikePostService)
);
export default router;
