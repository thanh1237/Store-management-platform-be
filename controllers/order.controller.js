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
      // Get friends of friends - populate the 'friends' array for every friend
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

// orderController.getProductId = catchAsync(async (req, res, next) => {
//   const proId = req.params.id;
//   const product = await Product.findById(proId);
//   if (!product)
//     return next(
//       new AppError(400, "Product not found", "Get Product by id Error")
//     );
//   return sendResponse(
//     res,
//     200,
//     true,
//     product,
//     null,
//     "Get Product successfully"
//   );
// });

// orderController.updateProduct = catchAsync(async (req, res, next) => {
//   const productId = req.params.id;
//   let { name, unit, cost, price, quantity, stock, type, ingredients } =
//     req.body;
//   if (!quantity) {
//     quantity = 1;
//   }
//   if (!stock) {
//     stock = 0;
//   }
//   const product = await Product.findOneAndUpdate(
//     { _id: productId },
//     {
//       name,
//       unit,
//       cost,
//       price,
//       quantity,
//       stock,
//       type,
//       ingredients,
//     }
//   );
//   if (!product)
//     return next(
//       new AppError(
//         400,
//         "Product not found or User not authorized",
//         "Update Product Error"
//       )
//     );
//   return sendResponse(
//     res,
//     200,
//     true,
//     { product },
//     null,
//     "Update Product Successful"
//   );
// });

// orderController.deleteProduct = catchAsync(async (req, res, next) => {
//   const id = req.params.id;
//   const product = await Product.findOneAndDelete({ _id: id });
//   if (!product)
//     return next(
//       new AppError(
//         400,
//         "Product not found or User not authorized",
//         "Delete Product Error"
//       )
//     );
//   return sendResponse(res, 200, true, null, null, "Delete product successful");
// });

module.exports = orderController;
