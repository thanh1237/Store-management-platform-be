const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Order = require("../models/Order");
const orderController = {};

orderController.getOrders = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;

  const orders = await Order.find({ ...filter })

    .populate({
      path: "stocks",
      populate: { path: "stocks" },
    })
    .populate("author");
  return sendResponse(res, 200, true, { orders }, null, "");
});

orderController.createOrder = catchAsync(async (req, res, next) => {
  let { stocks, author } = req.body;
  const order = await Order.create({
    stocks,
    author,
  });
  return sendResponse(
    res,
    200,
    true,
    { order },
    null,
    "Create Order Successful"
  );
});

module.exports = orderController;
