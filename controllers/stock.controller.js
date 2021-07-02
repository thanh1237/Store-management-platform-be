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
  const body = req.body;
  let { page, limit, sortBy, ...filter } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10000000;
  const offset = limit * (page - 1);
  let stockList;
  let stock;
  const orderId = body.find((e) => e).order;
  const userId = body.find((e) => e).author;
  body.forEach(async (obj) => {
    stock = await Stock.create({
      product: obj.product,
      order: obj.order,
      author: obj.author,
      start: obj.start,
      stockIn: obj.stockIn,
      stockOut: obj.stockOut,
      estimate: obj.estimate,
      real: obj.real,
      note: obj.note,
    });
    stockList = await Stock.find({ ...filter })
      .sort({ ...sortBy, createdAt: -1 })
      .skip(offset)
      .limit(limit);
    const stockArr = stockList.filter((stock) => stock.author.equals(userId));
    const order = await Order.findById(orderId).exec();
    const stockOfOrder = order.stocks;
    const stockIdArr = stockArr.map((e) => e._id);
    const update = stockOfOrder.concat(stockIdArr);

    let removeDuplicate = update.filter((c, index) => {
      return update.indexOf(c) === index;
    });

    await Order.findOneAndUpdate(
      { _id: order },
      { stocks: removeDuplicate, author: userId },
      { new: true }
    );
  });

  return sendResponse(
    res,
    200,
    true,
    { stock },
    null,
    "Create Stock Successful"
  );
});

stockController.updateStock = catchAsync(async (req, res, next) => {
  let body = req.body;
  let { page, limit, sortBy, ...filter } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  let stock = [];
  const totalNumReports = await Stock.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumReports / limit);
  const offset = limit * (page - 1);
  const stocks = await Stock.find({ ...filter })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("product");

  body.forEach(async (obj) => {
    let update = await Stock.findByIdAndUpdate(
      { _id: obj.stockId },
      {
        product: obj.product,
        order: obj.order,
        author: obj.author,
        start: obj.start,
        stockIn: obj.stockIn,
        stockOut: obj.stockOut,
        estimate: obj.estimate,
        real: obj.real,
        note: obj.note,
      },
      {
        new: true,
      }
    );
    stock.push(update._id);
  });

  // if (!stock)
  //   return next(
  //     new AppError(
  //       400,
  //       "Stock not found or User not authorized",
  //       "Update Stocks Error"
  //     )
  //   );
  return sendResponse(
    res,
    200,
    true,
    { stock },
    null,
    "Update Stock Successful"
  );
});

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
