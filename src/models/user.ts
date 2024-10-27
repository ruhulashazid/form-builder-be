import mongoose, { Schema } from "mongoose";

const USER_SCHEMA = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
  },
});

USER_SCHEMA.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;

  return userObject;
};

const User = mongoose.model("User", USER_SCHEMA);

export default User;
