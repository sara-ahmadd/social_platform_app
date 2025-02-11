import { Schema, Types, model } from "mongoose";

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
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    //this field is added to replies only
    mainComment: {
      type: Types.ObjectId,
      ref: "Comment",
    },
    likes: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

commentSchema.virtual("replies", {
  foreignField: "mainComment",
  localField: "_id",
  ref: "comment",
});

//using mongoose hooks to recursively delete a comment and all its replies as well
commentSchema.post(
  "deleteOne",
  { query: false, document: true },
  async function (doc, next) {
    // Populate replies to ensure we get nested replies
    await this.populate("replies");
    if (this.replies?.length) {
      for (const reply of this.replies) {
        await reply.deleteOne();
      }
    }
    next();
  }
);

export const CommentModel = model("comment", commentSchema);
