import { decode } from "jsonwebtoken";
import { verifyToken } from "../../utils/generateToken.js";
import { UserModel } from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  const { authorization } = req?.headers;
  if (!authorization) return next(new Error("User is unauthenticated"));
  const token = authorization.split(" ")[1];
  if (!token) return next(new Error("Token is required"));
  const data = verifyToken(token);
  const user = await UserModel.findById(data.id).lean();
  if (!user) return next(new Error("User is not found"));
  //extract time in which token is created
  //compare between it & last time password is changed
  //if token is created before password changed, return response : you must login first
  const payload = decode(token);
  const compareTimes =
    user.changePasswordTimeStamp.getTime() > payload.iat * 1000; //convert it to milliseconds;

  if (compareTimes) {
    return next(new Error("you must login first", { cause: 404 }));
  }

  req.user = user;
  return next();
};
