import { model, Schema, Types } from "mongoose";

export const genders = {
  male: "male",
  female: "female",
};
export const providers = {
  credentials: "credentials",
  google: "google",
};

export const defaultPicture = `${process.env.BASE_URL}/assets\\profile-pic.png`;

const UserSchema = new Schema(
  {
    userName: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider == providers.credentials ? true : false;
      },
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    DOB: {
      type: Date,
      required: true,
    },
    picture: {
      type: String,
      default: defaultPicture,
    },
    gender: {
      type: String,
      enum: [genders.male, genders.female],
      default: genders.male,
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    changePasswordTimeStamp: {
      type: Date,
      default: Date.now(),
    },
    provider: {
      type: String,
      enum: [...Object.values(providers)],
      default: providers.credentials,
    },
    tempEmail: {
      type: String,
      default: null,
    },
    views: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    blocked_users: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    friends: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    friend_requests: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = model("User", UserSchema);
