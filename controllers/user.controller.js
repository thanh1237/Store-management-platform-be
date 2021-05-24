const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const userController = {};

userController.register = catchAsync(async (req, res, next) => {
  let { name, email, avatarUrl, password, role } = req.body;
  let user = await User.findOne({ email });
  if (user)
    return next(new AppError(409, "User already exists", "Register Error"));

  // const salt = await bcrypt.genSalt(10);
  // password = await bcrypt.hash(password, salt);
  user = await User.create({
    name,
    email,
    password,
    avatarUrl,
    role,
  });
  const accessToken = await user.generateToken();

  return sendResponse(res, 200, true, { user }, null, "Create user successful");
});

userController.getCurrentUser = catchAsync(async (req, res, next) => {
  const userId = req.userId;
  const user = await User.findById(userId);
  if (!user)
    return next(new AppError(400, "User not found", "Get Current User Error"));
  return sendResponse(res, 200, true, user, null, "Get current user sucessful");
});

userController.getUsers = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;

  const currentUserId = req.userId;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const totalNumUsers = await User.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumUsers / limit);
  const offset = limit * (page - 1);

  const users = await User.find({ ...filter })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit);

  return sendResponse(res, 200, true, { users, totalPages }, null, "");
});

userController.deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findOneAndDelete({ _id: id });
  if (!user)
    return next(
      new AppError(
        400,
        "User not found or User not authorized",
        "Delete User Error"
      )
    );
  return sendResponse(res, 200, true, null, null, "Delete table successful");
});

module.exports = userController;
