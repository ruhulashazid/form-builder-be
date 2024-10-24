import express from "express";
import {
  getUserByIdController,
  signInUserController,
  signUpUserController,
  updateUserProfile,
} from "../controllers/user";
import { uploader } from "../common/multer";
import { API_REQUEST_ROUTES } from "../common/constants";

const router = express.Router();

// search user by id
router.get(API_REQUEST_ROUTES.GET_USER_BY_ID, getUserByIdController);

// login the user
router.post(API_REQUEST_ROUTES.USER_LOGIN, signInUserController);

// create new user
router.post(API_REQUEST_ROUTES.USER_REGISTER, signUpUserController);

router.put(
  API_REQUEST_ROUTES.PROFILE,
  uploader.single("avatar"),
  updateUserProfile
);

export default router;
