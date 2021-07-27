const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Order = require("../models/Order");
const orderController = {};

orderController.getOrders = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const totalNumReports = await Order.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumReports / limit);
  const offset = limit * (page - 1);
  const orders = await Order.find({ ...filter })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate({
      path: "stocks",
      populate: { path: "stocks" },
    })
    .populate("author");
  return sendResponse(res, 200, true, { orders, totalPages }, null, "");
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
