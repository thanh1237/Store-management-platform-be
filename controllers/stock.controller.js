const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Order = require("../models/Order");
const Stock = require("../models/Stock");
const stockController = {};

stockController.getStocks = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const totalNumReports = await Stock.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumReports / limit);
  const offset = limit * (page - 1);
  const stocks = await Stock.find({ ...filter })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("product");
  return sendResponse(res, 200, true, { stocks, totalPages }, null, "");
});

stockController.createStock = catchAsync(async (req, res, next) => {
  let { productId, userId, start, stockIn, stockOut, estimate, real, note } =
    req.body;
  let stock;
  const orderByAuthor = await Order.find({ author: userId });
  const orderId = orderByAuthor?.find((e) => {
    return e._id;
  })?._id;

  if (orderId) {
    const order = await Order.findById(orderId);
    stock = await Stock.create({
      product: productId,
      order: orderId,
      author: userId,
      start,
      stockIn,
      stockOut,
      estimate,
      real,
      note,
    });
    const stockArray = order.stocks;
    const updateStockArr = stockArray.concat([stock._id]);
    await Order.findByIdAndUpdate(orderId, {
      stocks: updateStockArr,
    });
  } else if (!orderId) {
    stock = await Stock.create({
      product: productId,
      author: userId,
      start,
      stockIn,
      stockOut,
      estimate,
      real,
      note,
    });
    const order = await Order.create({
      stocks: [stock._id],
      author: userId,
    });

    const stockId = stock._id;
    stock = await Stock.findByIdAndUpdate(stockId, { order: [order._id] });
  }

  return sendResponse(
    res,
    200,
    true,
    { stock },
    null,
    "Create Stock Successful"
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

module.exports = stockController;
