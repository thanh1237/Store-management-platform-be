const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");
const Order = require("../models/Order");
const Stock = require("../models/Stock");
const User = require("../models/User");
const productController = {};

productController.getProducts = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;
  // page = parseInt(page) || 1;
  // limit = parseInt(limit) || 10;

  // const totalNumProducts = await Product.find({ ...filter }).countDocuments();
  // const totalPages = Math.ceil(totalNumProducts / limit);
  // const offset = limit * (page - 1);

  const products = await Product.find({ ...filter });

  return sendResponse(res, 200, true, { products }, null, "");
});

productController.getProductId = catchAsync(async (req, res, next) => {
  const proId = req.params.id;
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
  let {
    name,
    unit,
    cost,
    capacity,
    capacityUnit,
    price,
    quantity,
    type,
    ingredients,
    stock,
  } = req.body;
  const product = await Product.create({
    name,
    unit,
    cost,
    price,
    capacity,
    capacityUnit,
    quantity,
    type,
    ingredients,
  });
  if (type === "Beer" || type === "Alcohol" || type === "Ingredient") {
    let { page, limit, sortBy, ...filter } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = limit * (page - 1);
    const users = await User.find({ ...filter })
      .sort({ ...sortBy, createdAt: -1 })
      .skip(offset)
      .limit(limit);
    // Array of userIds
    const userIds = users.map((e) => e._id);
    // For each userIds create orders, stocks
    userIds?.map(async (e) => {
      const orderByUser = await Order.findOne({ author: e }).exec();
      const orderIdByUser = orderByUser?._id;
      if (orderIdByUser) {
        const order = await Order.findById(orderIdByUser);
        let stocks = await Stock.create({
          product: product._id,
          order: order._id,
          author: e,
          real: stock,
        });
        const stockArray = order.stocks;
        const updateStockArr = stockArray.concat([stocks._id]);
        await Order.findByIdAndUpdate(order._id, {
          stocks: updateStockArr,
        });
      } else if (!orderIdByUser) {
        let stocks = await Stock.create({
          product: product._id,
          author: e,
          real: stock,
        });
        const order = await Order.create({
          stocks: [stocks._id],
          author: e,
        });
        const stockId = stocks._id;
        stocks = await Stock.findByIdAndUpdate(stockId, { order: [order._id] });
      }
    });
  }
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
  let {
    name,
    unit,
    cost,
    capacity,
    capacityUnit,
    price,
    quantity,
    type,
    ingredients,
  } = req.body;

  if (!quantity) {
    quantity = 1;
  }
  if (!capacityUnit) {
    capacityUnit = "ml";
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId },
    {
      name,
      unit,
      cost,
      capacity,
      capacityUnit,
      price,
      quantity,
      type,
      ingredients,
    },
    { new: true }
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
