const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Stock = require("../models/Stock");
const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const stockController = {};

stockController.getStocks = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const totalNumProducts = await Stock.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumProducts / limit);
  const offset = limit * (page - 1);
  const { productId } = req.body;
  const stocks = await Stock.find({ product: productId })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit);

  return sendResponse(res, 200, true, { stocks, totalPages }, null, "");
});

stockController.createStock = catchAsync(async (req, res, next) => {
  let { productId, yesterdayStock, stockIn, stockOut, estimate, real, note } =
    req.body;
  const product = await Product.findById(productId);
  const stock = await Stock.create({
    product: productId,
    yesterdayStock,
    stockIn,
    stockOut,
    estimate,
    real,
    note,
  });

  let stockArr = product.stock;
  console.log(product.stock);
  stockArr.push(stock._id);

  const updateProduct = await Product.findByIdAndUpdate(productId, {
    stock: stockArr,
  });
  return sendResponse(
    res,
    200,
    true,
    { updateProduct },
    null,
    "Create Product Successful"
  );
});

// productController.updateProduct = catchAsync(async (req, res, next) => {
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

// productController.deleteProduct = catchAsync(async (req, res, next) => {
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
