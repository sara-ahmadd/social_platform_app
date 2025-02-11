import { model, Schema, Types } from "mongoose";
export const visibilityOptions = {
  public: "public",
  friends: "friends",
  exceptions: "exceptions",
};
const postSchema = new Schema(
  {
    text: {
      type: String,
    },
    images: {
      type: [{ secure_url: String, public_id: String }],
      required: function () {
        return this.text ? false : true;
      },
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
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
    cloudFolder: {
      type: String,
      required: true,
    },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    visibility: {
      type: String,
      default: visibilityOptions.public,
    },
    exceptions: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

postSchema.virtual("comments", {
  foreignField: "post",
  localField: "_id",
  ref: "comment",
});

export const PostModel = model("post", postSchema);
