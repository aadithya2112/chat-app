import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface NewRequest extends Request {
  user?: any;
}

export const authMiddleware = (
  req: NewRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).send({
      status: "failed",
      message: "Authorization header missing",
    });
  } else {
    const token = authHeader.split(" ")[1]; // Extract the token (Bearer <token>)

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).send({
        status: "failed",
        message: "Invalid or expired token",
      });
    }
  }
};
