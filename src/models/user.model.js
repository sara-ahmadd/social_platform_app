import { model, Schema } from "mongoose";

export const genders = {
  male: "male",
  female: "female",
};
export const providers = {
  credentials: "credentials",
  google: "google",
};

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
      default: "assets\\profile-pic.jpg",
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
  },
  { timestamps: true }
);

export const UserModel = model("User", UserSchema);
