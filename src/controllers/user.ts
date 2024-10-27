import { Request, Response } from "express";
import { logger } from "../common/pino";
import {
  REQUEST_FAILURE_MESSAGES,
  REQUEST_SUCCESS_MESSAGE,
  SECRET_KEY,
  UNAUTHORIZED_ACCESS,
} from "../common/constants";
import Users from "../models/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import cloudinary from "../common/Cloudinary";
import mongoose from "mongoose";

const LOGGED_IN = "Logged In";
const ONE_DAY = "1d";

export const updateUserProfile = async (req: any, res: Response) => {
  if (!req?.isUserAuth) {
    return res.status(401).send({ message: UNAUTHORIZED_ACCESS });
  }
  const authUserId = req.userId;
  const username = req.body.username;
  const email = req.body.email;
  const phone = req.body.phone;

  let uploadedFileUrl: string | null = null;
  const avatar = req.file as Express.Multer.File | null;
  if (!!avatar) {
    const fileUploadResult = await cloudinary.uploader.upload(avatar.path);
    uploadedFileUrl = cloudinary.url(fileUploadResult.public_id);
    await fs.unlink(avatar.path);
  }

  const updatedUser = await Users.findByIdAndUpdate(
    authUserId,
    {
      email,
      phone,
      username,
      image: uploadedFileUrl,
    },
    {
      returnDocument: "after",
    }
  ).exec();

  if (!updatedUser) {
    return res.json({
      message: "Failed to update user profile",
    });
  }

  return res.json({
    message: "Updated successfully",
    user: updatedUser?.toJSON(),
  });
};

export const getUserByIdController = (req: Request, res: Response) => {
  Users.findById(req.params.id)
    .then((result) => {
      logger.info(REQUEST_SUCCESS_MESSAGE.USER_LOGGEDIN_SUCCESSFULLY);
      res.status(200).send(result);
    })
    .catch((error: any) => {
      logger.error(
        REQUEST_FAILURE_MESSAGES.ERROR_IN_FETCHING_USER_DATA,
        error?.message
      );

      return res.status(500).json({
        error: error,
      });
    });
};

export const getUserList = async (
  req: Request & Record<string, any>,
  res: Response
) => {
  if (!req?.isUserAuth) {
    return res.status(401).send({ message: UNAUTHORIZED_ACCESS });
  }

  if (req.userRole !== "admin") {
    return res.status(403).send({ message: UNAUTHORIZED_ACCESS });
  }

  try {
    const users = await Users.find({
      _id: { $ne: req.userId },
    }).exec();

    return res.json({
      users: users.map((u) => u.toJSON()),
    });
  } catch (error) {
    console.log("err", (error as Error).stack);
    return res.json({
      users: [],
    });
  }
};

export const deleteProfileController = async (
  req: Request & Record<string, any>,
  res: Response
) => {
  if (!req?.isUserAuth) {
    return res.status(401).send({ message: UNAUTHORIZED_ACCESS });
  }

  const userId = req.params.userId;

  try {
    const result = await Users.findByIdAndDelete(userId).exec();

    return res.json({
      message: "Profile deleted successfully",
      user: result,
    });
  } catch (error) {
    return res.json({
      message: (error as any).message,
    });
  }
};

export const signUpUserController = (req: Request, res: Response) => {
  try {
    let user = new Users(req.body);
    Users.find({ email: req.body.email }).then((response) => {
      if (response.length > 0) {
        res.status(403).send(REQUEST_FAILURE_MESSAGES.USER_ALREADY_EXISTS);
      } else {
        bcrypt.hash(user.password, 12).then((hashedPassword: string) => {
          user.password = hashedPassword;
          user.save().then((response) => {
            logger.info(
              REQUEST_SUCCESS_MESSAGE.USER_CREATED_SUCCESSFULLY,
              req.body.email
            );

            const token = jwt.sign(
              {
                email: response.email,
                username: response.username,
                userId: response.id,
                role: response.role,
              },
              SECRET_KEY,
              { expiresIn: ONE_DAY }
            );

            logger.info(REQUEST_SUCCESS_MESSAGE.USER_LOGGEDIN_SUCCESSFULLY, {
              email: response.email,
              username: response.username,
            });

            // login the user as soon as user logs in
            res.status(200).json({
              message: LOGGED_IN,
              token: token,
              data: {
                email: response.email,
                username: response.username,
                userId: response.id,
                phone: response.phone,
                role: response.role,
              },
            });
          });
        });
      }
    });
  } catch (error) {
    logger.error(
      REQUEST_FAILURE_MESSAGES.UNABLE_TO_CREATE_USER,
      req.body.email,
      error
    );
    res.status(500).send(REQUEST_FAILURE_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

export const signInUserController = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ msg: REQUEST_FAILURE_MESSAGES.PLEASE_ENTER_ALL_FIELDS });
  }

  Users.find({ email: email })
    .then((user: any) => {
      if (user.length == 0) {
        logger.error(REQUEST_FAILURE_MESSAGES.USER_DATA_NOT_FOUND, email);
        res
          .status(403)
          .send({ message: REQUEST_FAILURE_MESSAGES.USER_DATA_NOT_FOUND });
      } else {
        const { email, username, _id, image, phone, role } = user[0];
        bcrypt
          .compare(password, user[0].password)
          .then((isMatched: boolean) => {
            if (!isMatched) {
              res
                .status(402)
                .send({ message: REQUEST_FAILURE_MESSAGES.PASSWORD_INCORRECT });
            } else {
              const token = jwt.sign(
                {
                  image,
                  phone,
                  email,
                  username,
                  userId: _id.toString(),
                  role,
                },
                SECRET_KEY,
                { expiresIn: ONE_DAY }
              );
              logger.info(REQUEST_SUCCESS_MESSAGE.USER_LOGGEDIN_SUCCESSFULLY, {
                email,
                username,
              });
              res.status(200).json({
                message: LOGGED_IN,
                token: token,
                data: {
                  role,
                  image,
                  phone,
                  email,
                  username,
                  userId: _id.toString(),
                },
              });
            }
          })
          .catch((error: any) => {
            logger.error(
              REQUEST_FAILURE_MESSAGES.UNABLE_TO_SIGNIN_USER,
              email,
              error
            );
            res
              .status(401)
              .send(REQUEST_FAILURE_MESSAGES.UNABLE_TO_SIGNIN_USER);
          });
      }
    })
    .catch((error: any) => {
      logger.error(
        REQUEST_FAILURE_MESSAGES.UNABLE_TO_SIGNIN_USER,
        email,
        error
      );
      res.status(500).send(REQUEST_FAILURE_MESSAGES.UNABLE_TO_SIGNIN_USER);
    });
};
