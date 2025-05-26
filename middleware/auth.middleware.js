import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export function verifyToken(req, res, next) {
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new ApiError(401, "No token provided"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new ApiError(403, "Invalid token"));
    }

    req.user = decoded;
    next();
  });
}
