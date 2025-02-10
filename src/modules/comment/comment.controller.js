import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated";

const router = Router({ mergeParams: true });

//create comment >>> /post/:id/comment
router.post(
  "/",
  asyncHandler(isAuthenticated),
  asyncHandler(createCommentService)
);

export default router;
