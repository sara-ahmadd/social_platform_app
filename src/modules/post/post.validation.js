import joi from "joi";
import { isValidObjectId } from "mongoose";
import { fileObject } from "../user/user.validation.js";
import { visibilityOptions } from "../../models/post.model.js";
export const checkValidMongoObjectId = function (value, helpers) {
  if (!isValidObjectId(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};
const postFields = {
  text: joi.string(),
  file: joi.array().items(
    joi.object({
      ...fileObject,
      //images is the name of the field of formdata that contains images
      fieldname: joi.string().valid("images").required(),
    })
  ),
  visibility: joi.string().valid(...Object.values(visibilityOptions)),
  exceptions: joi.string(),
};

export const createPostValidation = joi
  .object(postFields)
  .required()
  .or("text", "file");
export const getAllPostsValidation = joi
  .object({
    active: joi.string(),
  })
  .required();
export const getAllPostsOfSpecificUserValidation = joi
  .object({
    userId: joi.string().custom(checkValidMongoObjectId),
    type: joi.string().valid(...Object.values(visibilityOptions)),
  })
  .required();
export const updatePostValidation = joi
  .object({
    ...postFields,
    id: joi.string().custom(function (value, helpers) {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  })
  .required();

export const getPostByIdSchema = joi
  .object({
    id: joi.string().custom(function (value, helpers) {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  })
  .required();

export const undoPostSchema = joi
  .object({
    id: joi.string().custom(function (value, helpers) {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  })
  .required();
export const deletePostSchema = joi
  .object({
    id: joi.string().custom(function (value, helpers) {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  })
  .required();
export const likeUnlikePostSchema = joi
  .object({
    postId: joi.string().custom(function (value, helpers) {
      if (!isValidObjectId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  })
  .required();
