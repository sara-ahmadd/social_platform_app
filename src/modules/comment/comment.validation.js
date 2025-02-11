import joi from "joi";
import { fileObject } from "../user/user.validation.js";
import { checkValidMongoObjectId } from "../post/post.validation.js";

const commentFields = {
  text: joi.string(),
  file: joi.object({
    ...fileObject,
    //image is the name of the field of formdata that contains image
    fieldname: joi.string().valid("image"),
  }),
  id: joi.string().custom(checkValidMongoObjectId).required(),
};

export const createCommentSchema = joi
  .object(commentFields)
  .required()
  .or("text", "file");

export const updateCommentSchema = joi
  .object({
    ...commentFields,
    commentId: joi.string().custom(checkValidMongoObjectId).required(),
  })
  .required();

export const deleteCommentSchema = joi
  .object({
    id: joi.string().custom(checkValidMongoObjectId).required(),
    commentId: joi.string().custom(checkValidMongoObjectId).required(),
  })
  .required();

export const addReplySchema = joi
  .object({
    id: joi.string().custom(checkValidMongoObjectId).required(), //post id
    commentId: joi.string().custom(checkValidMongoObjectId).required(), //comment id
    reply_text: joi.string(),
    file: joi.object({
      ...fileObject,
      //image is the name of the field of formdata that contains image
      fieldname: joi.string().valid("image"),
    }),
  })
  .required()
  .or("reply_text", "file");

export const likeUnlikeCommentSchema = joi
  .object({
    id: joi.string().custom(checkValidMongoObjectId).required(), //post id
    commentId: joi.string().custom(checkValidMongoObjectId).required(),
  })
  .required();
