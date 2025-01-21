import jwt from "jsonwebtoken";
export const generateToken = (payload, expirationTime) => {
  //create access token
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: expirationTime,
  });
  return token;
};
