import { nanoid } from "nanoid";
import cloudinary from "../../../utils/cloudUpload.js";
import { PostModel, visibilityOptions } from "../../models/post.model.js";
import { roles } from "../user/user.validation.js";
import { UserModel } from "../../models/user.model.js";
import { checkValidMongoObjectId } from "./post.validation.js";
import dayjs from "dayjs";

/**
 *Get app losts based on visibility (type) and activity(active / deleted)
 * @param {String} userId
 * @param {Boolean} active
 */
export async function getAllPosts(userId, active) {
  let posts;
  if (active == undefined) {
    posts = await PostModel.find({
      user: userId,
    }).populate([
      { path: "user", select: "userName email picture" },
      {
        path: "comments",
        match: { mainComment: { $exists: false } },
        select: "text image user",
        populate: [
          {
            path: "replies",
            select: "text image user",
            populate: [{ path: "user", select: "userName email picture" }],
          },
          { path: "user", select: "userName email picture" },
        ],
      },
    ]);
  } else {
    posts = await PostModel.find({
      isDeleted: !active,
      user: userId,
    }).populate([
      { path: "user", select: "userName email picture" },
      {
        path: "comments",
        select: "text image user",
        match: { mainComment: { $exists: false } },
        populate: [
          {
            path: "replies",
            select: "text image user",
            popoulate: { path: "user", select: "userName email picture" },
          },
          { path: "user", select: "userName email picture" },
        ],
      },
    ]);
  }
  return posts;
}

export const getALLPostsService = async (req, res, next) => {
  const { user } = req;
  const { active } = req.query;
  const posts = await getAllPosts(
    user._id,
    active == "true" ? true : active == "false" ? false : undefined
  );
  return res.status(200).json({ status: "Success", posts });
};
/**
 *This controller gets the posts of the target user based on the type of posts provided 
    in request query params.
    - if type = friends >> check if the current user is a friend with the target user then
       return all posts with visibility = friends
    - if type = exceptions >> get all posts with visibility = exceptions and where
         the current user is not in the exception list of those posts
    - Else return all posts
 * @param {Request} req
 * @param {Response} res
 * @param {NextExpressMiddleware} next
 * @returns
 */
export const getALLPostsOfSpecificUser = async (req, res, next) => {
  const { user: currentUser } = req;
  const { userId } = req.params;
  const { type } = req.query;

  const targetUser = await UserModel.findById(userId);
  //check current user sitution (friend)
  const friend = targetUser.friends.includes(currentUser._id);

  if (type == visibilityOptions.friends) {
    if (friend) {
      const posts = await PostModel.find({
        user: userId,
        visibility: visibilityOptions.friends,
        isDeleted: false,
        isArchived: false,
      }).populate([
        { path: "user", select: "userName email picture.secure_url" },
        {
          path: "comments",
          select: "text image",
          match: { mainComment: { $exists: false } },
          populate: [
            {
              path: "replies",
              select: "text image user",
              popoulate: { path: "user", select: "userName email picture" },
            },
            { path: "user", select: "userName email picture" },
          ],
        },
      ]);
      return res.status(200).json({ status: "Success", posts });
    }
  }
  if (type == visibilityOptions.exceptions) {
    //check if the current user is NOT in the exceptions list of the post
    const posts = await PostModel.find({
      visibility: visibilityOptions.exceptions,
      user: userId,
      isDeleted: false,
      isArchived: false,
      exceptions: { $nin: [currentUser._id.toString()] },
    }).populate([
      { path: "user", select: "userName email picture.secure_url" },
      {
        path: "comments",
        select: "text image user",
        match: { mainComment: { $exists: false } },
        populate: [
          {
            path: "replies",
            select: "text image user",
            popoulate: { path: "user", select: "userName email picture" },
          },
          { path: "user", select: "userName email picture" },
        ],
      },
    ]);
    return res.status(200).json({
      status: "success",
      posts,
      currUserId: currentUser._id.toString(),
    });
  }

  const posts = await getAllPosts(userId, true);
  return res.status(200).json({ status: "Success", posts });
};
export const createPostService = async (req, res, next) => {
  //array os files returned from multer are kept in file property in request object
  const { user, files } = req;
  const { text, exceptions, visibility } = req.body;
  let cloudFolder = nanoid();
  let postImages = [];

  if (files?.length) {
    for (let file of files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `users/${user._id}/posts/${cloudFolder}`,
        }
      );
      postImages.push({ secure_url, public_id });
    }
  }
  let excepitonList = [];

  if (exceptions) {
    const excepList = exceptions.split(",");
    const allValidId = excepList.every((item) => checkValidMongoObjectId(item));
    if (excepList.length > 0 && allValidId) {
      excepitonList.push(...excepList);
    }
  }
  //create post in DB
  const post = await PostModel.create({
    ...req.body,
    images: postImages,
    user: user._id,
    cloudFolder,
    visibility: visibility ? visibility : visibilityOptions.public,
    exceptions: excepitonList,
  });

  return res
    .status(201)
    .json({ status: "Success", message: "Post is created successfully", post });
};

export const updatePostService = async (req, res, next) => {
  //get the user & files if the user update files
  const { user, files } = req;
  //get post id from params
  const { id } = req.params;
  //body may contain text or images
  const { text } = req.body;

  //get the targetted post
  const post = await PostModel.findById(id);

  if (!post) return next(new Error("Post is not found", { cause: 404 }));

  //check the user is the post owner
  if (post.user.toString() !== user._id.toString())
    return next(new Error("You arenot authorized to update that post"));
  //if there are files update them
  const images = [];
  if (files?.length) {
    await cloudinary.api.delete_all_resources(
      post.images.map((img) => img.public_id)
    );
    for (let file of files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `users/${user._id}/posts/${post.cloudFolder}`,
        }
      );
      images.push({ secure_url, public_id });
    }
  }

  const updatedPost = await PostModel.findByIdAndUpdate(
    id,
    {
      images: images.length ? images : post.images,
      text: text ? text : post.text,
    },
    { new: true }
  );
  return res.status(200).json({
    status: "Success",
    message: "Post is updated successfully",
    updatedPost,
  });
};

export const getPostByIdService = async (req, res, next) => {
  const post = await PostModel.findById(req.params.id)
    .select("-deletedBy -createdAt -updatedAt")
    .populate({ path: "user", select: "userName email picture" })
    .lean();
  if (!post) return next(new Error("Post is not found", { cause: 404 }));
  return res.status(200).json({ status: "Success", post });
};
export const undoPostService = async (req, res, next) => {
  //check user type
  const { user } = req;
  const post = await PostModel.findById(req.params.id);
  if (!post) return next(new Error("Post is not found", { cause: 404 }));
  if (
    post.user.toString() !== user._id.toString() &&
    user.role !== roles.admin
  ) {
    return next(
      new Error("You arenot authorized to delete that post", { cause: 400 })
    );
  }
  //check if the post is created since 2 mins
  const creationTime = new Date(post.createdAt).getTime();
  const currentTime = new Date().getTime();
  // true if creationTime is at least 2 mins before currentTime
  const isBeforeTwoMinutes = currentTime - creationTime < 120000;
  const timeDiff =
    dayjs(currentTime).valueOf() <=
    dayjs(creationTime).add(2, "minute").valueOf();

  if (!timeDiff) {
    return next(new Error("Cannot undo post creation", { cause: 400 }));
  }
  //delete post from DB
  await PostModel.deleteOne({ _id: req.params.id });
  //delete post images from cloudinary then delete the folder itself
  await cloudinary.api.delete_all_resources(post.images);
  await cloudinary.api.delete_folder(
    `users/${user._id}/posts/${post.cloudFolder}`
  );

  return res.status(200).json({
    status: "Success",
    message: "undo post is successful",
    creationTime,
    currentTime,
    timeDiff,
    isBeforeTwoMinutes,
  });
};
export const deletePostService = async (req, res, next) => {
  //check user type
  const { user } = req;
  const post = await PostModel.findById(req.params.id);
  if (!post) return next(new Error("Post is not found", { cause: 404 }));
  if (
    post.user.toString() !== user._id.toString() &&
    user.role !== roles.admin
  ) {
    return next(
      new Error("You arenot authorized to delete that post", { cause: 400 })
    );
  }
  //delete post from DB
  post.isDeleted = true;
  post.deletedBy = user._id;
  await post.save();
  return res
    .status(200)
    .json({ status: "Success", message: "post is soft-deleted successfully" });
};
export const archivePostService = async (req, res, next) => {
  //check user type
  const { user } = req;
  const post = await PostModel.findById(req.params.id);
  if (!post) return next(new Error("Post is not found", { cause: 404 }));
  if (
    post.user.toString() !== user._id.toString() &&
    user.role !== roles.admin
  ) {
    return next(
      new Error("You arenot authorized to delete that post", { cause: 400 })
    );
  }
  //delete post from DB
  post.isArchived = true;
  await post.save();
  return res
    .status(200)
    .json({ status: "Success", message: "post is archived successfully" });
};

export const likeUnlikePostService = async (req, res, next) => {
  const { user } = req;

  const { postId } = req.params;
  let liked = true;
  const post = await PostModel.findById(postId);
  if (!post) return next(new Error("Post is not found", { cause: 404 }));

  if (post.likes.includes(user._id)) {
    post.likes = post.likes.filter((like) => like.toString() !== user._id);
    liked = false;
  } else {
    liked = true;
    post.likes.push(user._id);
  }
  await post.save();
  const updatedPost = await PostModel.findById(postId)
    .select("user likes text images")
    .populate({
      path: "likes",
      select: "userName picture",
    });
  return res.status(200).json({
    status: "Success",
    message: liked ? "you liked the post" : "you unliked the post",
    updatedPost,
  });
};
