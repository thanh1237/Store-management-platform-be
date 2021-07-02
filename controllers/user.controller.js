const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Stock = require("../models/Stock");
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

  let { page, limit, sortBy, ...filter } = req.query;

  const totalNumProducts = await Product.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumProducts / limit);
  const offset = limit * (page - 1);

  const products = await Product.find({ ...filter })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset);

  const noneCocktailList = products?.filter((e) => e.type !== "Cocktail");
  const noneMocktailList = noneCocktailList?.filter(
    (e) => e.type !== "Mocktail"
  );
  const productId = noneMocktailList?.map((e) => e._id);
  const order = await Order.create({
    author: user._id,
  });
  const create = productId?.map(async (e) => {
    let newStock = await Stock.create({
      product: e,
      order: order._id,
      author: user._id,
      start: 0,
      stockIn: 0,
      stockOut: 0,
      estimate: 0,
      real: 0,
      note: 0,
    });
    let stockList = await Stock.find({ ...filter }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    })
      .sort({ ...sortBy, createdAt: -1 })
      .skip(offset);
    const stockArr = stockList.filter((stock) => stock.author.equals(user._id));
    const newOrder = await Order.findById(order._id).exec();
    const stockOfOrder = newOrder.stocks;
    const stockIdArr = stockArr.map((e) => e._id);
    const update = stockOfOrder.concat(stockIdArr);
    let removeDuplicate = update.filter((c, index) => {
      return update.indexOf(c) === index;
    });
    await Order.findOneAndUpdate(
      { _id: order._id },
      { stocks: removeDuplicate, author: user._id },
      { new: true }
    );
  });

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
  const order = await Order.findOne({ author: id });
  await Order.findOneAndDelete({ _id: order._id });

  return sendResponse(res, 200, true, null, null, "Delete table successful");
});

userController.changePassword = catchAsync(async (req, res, next) => {
  let userId = req.params.id;
  let { name, password, email, role } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: userId },
    {
      name,
      password,
      email,
      role,
    }
  );
  if (!user)
    return next(
      new AppError(
        400,
        "User not found or User not authorized",
        "Change password fail"
      )
    );
  return sendResponse(
    res,
    200,
    true,
    { user },
    null,
    "Change Password Successful"
  );
});

module.exports = userController;
