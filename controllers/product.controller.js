const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");
const productController = {};

productController.getProducts = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const totalNumProducts = await Product.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumProducts / limit);
  const offset = limit * (page - 1);

  const products = await Product.find({ ...filter })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit);

  return sendResponse(res, 200, true, { products, totalPages }, null, "");
});

productController.getProductId = catchAsync(async (req, res, next) => {
  const proId = req.productId;
  const product = await Product.findById(proId);
  if (!product)
    return next(
      new AppError(400, "Product not found", "Get Product by id Error")
    );
  return sendResponse(
    res,
    200,
    true,
    product,
    null,
    "Get Product successfully"
  );
});

productController.createProduct = catchAsync(async (req, res, next) => {
  let { name, unit, cost, price, quantity, stock } = req.body;
  const product = await Product.create({
    name,
    unit,
    cost,
    price,
    quantity,
    stock,
  });

  return sendResponse(
    res,
    200,
    true,
    { product },
    null,
    "Create Product Successful"
  );
});

productController.updateProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  let { name, unit, cost, price, quantity, stock } = req.body;
  if (!quantity) {
    quantity = 1;
  }
  if (!stock) {
    stock = 0;
  }
  const product = await Product.findOneAndUpdate(
    { _id: productId },
    {
      name,
      unit,
      cost,
      price,
      quantity,
      stock,
    }
  );
  if (!product)
    return next(
      new AppError(
        400,
        "Product not found or User not authorized",
        "Update Product Error"
      )
    );
  return sendResponse(
    res,
    200,
    true,
    { product },
    null,
    "Update Product Successful"
  );
});

productController.deleteProduct = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findOneAndDelete({ _id: id });
  if (!product)
    return next(
      new AppError(
        400,
        "Product not found or User not authorized",
        "Delete Product Error"
      )
    );
  return sendResponse(res, 200, true, null, null, "Delete product successful");
});

module.exports = productController;
