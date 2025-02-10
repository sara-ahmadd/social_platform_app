const { Schema, Types, model } = require("mongoose");

const commentSchema = new Schema(
  {
    post: { type: Types.ObjectId, required: true, ref: "Post" },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
    },
    image: {
      type: { secure_url: String, public_id: String },
      required: function () {
        return this.text ? false : true;
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    likes: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const CommentModel = model("comment", commentSchema);
