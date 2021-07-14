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

  return sendResponse(
    res,
    200,
    true,
    { stock },
    null,
    "Update Stock Successful"
  );
});

module.exports = stockController;
