import { PostModel } from "./../../models/post.model.js";
import cloudinary from "./../../../utils/cloudUpload.js";
import { CommentModel } from "../../models/comment.model.js";
import { roles } from "../user/user.validation.js";

export const createCommentService = async (req, res, next) => {
  //get post id
  const { id } = req.params;
  //get user id
  const { user, file } = req;

  const { text } = req.body;
  const post = await PostModel.findById(id);
  if (!post) return next(new Error("post is not found", { cause: 404 }));
  let image;
  if (file) {
    //get cloud folder of post to put comments images inside it
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `/users/${user._id}/posts/${post.cloudFolder}/comments`,
      }
    );
    image = { secure_url, public_id };
  }

  const comment = await CommentModel.create({
    post: id,
    user: user._id,
    text,
    image: file ? image : null,
    file,
  });
  return res.status(200).json({ status: "Success", comment });
};

export const updateCommentService = async (req, res, next) => {
  const { user, file } = req;
  const { commentId, id } = req.params;
  const { text } = req.body;

  const comment = await CommentModel.findById(commentId);
  if (!comment) return next(new Error("comment is not found", { cause: 404 }));

  const post = await PostModel.findById(id);
  if (!post) return next(new Error("post is not found", { cause: 404 }));

  if (user._id.toString() !== comment.user.toString()) {
    return next(new Error("you cannot update this comment", { cause: 400 }));
  }

  let image;
  if (file) {
    //remove older comment image from cloudinary
    await cloudinary.uploader.destroy(comment.image.public_id);

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      { folder: `/users/${user._id}/posts/${post.cloudFolder}/comments` }
    );
    image = { secure_url, public_id };
  }

  comment.text = text ? text : comment.text;
  comment.image = file ? image : comment.image;
  await comment.save();

  const updatedComment = await CommentModel.findById(commentId);

  return res.status(200).json({
    status: "Success",
    message: "comment is updated successfully",
    updatedComment,
  });
};

export const deleteCommentService = async (req, res, next) => {
  const { user } = req;
  const { commentId, id } = req.params;

  const comment = await CommentModel.findById(commentId);
  if (!comment) return next(new Error("comment is not found", { cause: 404 }));

  const post = await PostModel.findById(id);
  if (!post) return next(new Error("post is not found", { cause: 404 }));

  if (
    user._id.toString() !== comment.user.toString() &&
    user._id.toString() !== post.user.toString() &&
    user.role !== roles.admin
  ) {
    return next(new Error("you cannot delete this comment", { cause: 400 }));
  }
  if (comment.image) {
    await cloudinary.uploader.destroy(comment.image.public_id);
  }

  await comment.deleteOne({ _id: commentId });

  return res.status(200).json({
    status: "Success",
    message: "comment is deleted successfully",
  });
};

export const addReplyService = async (req, res, next) => {
  //get comment id
  const { commentId, id } = req.params;
  const { reply_text } = req.body;
  const { user, file } = req;
  //get main comment to which reply is added
  const comment = await CommentModel.findById(commentId);
  if (!comment) return next(new Error("comment is not found"));

  //get current post to get its cloud folder name to add comment image inside it
  const post = await PostModel.findById(id);
  if (!post) return next(new Error("post is not found"));
  let image;
  if (file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `/users/${user._id}/posts/${post.cloudFolder}/comments`,
      }
    );
    image = { secure_url, public_id };
  }

  const reply = await CommentModel.create({
    text: reply_text,
    image: file ? image : null,
    mainComment: commentId,
    post: post._id,
    user: user._id,
  });
  return res.status(201).json({ status: "Success", reply });
};

export const likeUnlikeCommentService = async (req, res, next) => {
  const { user } = req;
  const { commentId } = req.params;

  let liked = true;

  const comment = await CommentModel.findById(commentId);
  if (!comment) return next(new Error("comment is not found", { cause: 404 }));

  if (comment.likes.includes(user._id)) {
    comment.likes = comment.likes.filter(
      (like) => like.toString() !== user._id.toString()
    );
    liked = false;
  } else {
    comment.likes.push(user._id);
    liked = true;
  }
  await comment.save();
  const updatedComment = await CommentModel.findById(commentId)
    .select("user likes text image")
    .populate({
      path: "likes",
      select: "userName picture email",
    });
  return res.status(200).json({
    status: "Success",
    message: liked ? "you liked the Comment" : "you unliked the Comment",
    updatedComment,
  });
};
