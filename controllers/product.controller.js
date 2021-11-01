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
const Supplier = require("../models/Supplier");
const cukcukApi = require("../middlewares/cukcukApi ");
const crypto = require("crypto");
const moment = require("moment");
const productController = {};

productController.getProducts = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;
  let missingProduct = [];
  let todayRevenue = 0;
  let todayCost = 0;
  let yesterdayRevenue = 0;
  let yesterdayCost = 0;
  const products = await Product.find({ ...filter });
  const date = new Date();
  const yesterday = moment().subtract(1, "days");
  const appSecret = process.env.REACT_APP_SECRET_KEY;
  const string = JSON.stringify({
    AppID: "CUKCUKOpenPlatform",
    Domain: "bake",
    LoginTime: date,
  });
  const hash = crypto
    .createHmac("sha256", appSecret)
    .update(string)
    .digest("hex");
  const cukcuk = await cukcukApi.post("/Account/Login", {
    AppID: "CUKCUKOpenPlatform",
    Domain: "bake",
    LoginTime: date,
    SignatureInfo: hash,
  });
  const cukcukOrders = await cukcukApi.post("/v1/orders/paging", {
    Page: 1,
    Limit: 100,
    BranchId: null,
    HaveCustomer: true,
  });
  const Orders = cukcukOrders.data.Data;
  const orderByDate = await Orders.filter((e) => {
    return (
      moment(e.Date).format("YYYY-MM-DD") === moment(date).format("YYYY-MM-DD")
    );
  });

  const idList = await orderByDate?.map((e) => e.Id);

  const cukcukRes = await idList?.map(async (id) => {
    let orderDetails = [];
    const res = await cukcukApi.get(`/v1/orders/${id}`);
    orderDetails.push(res.data.Data);
    const mapRes = orderDetails.map((e) => {
      return e.OrderDetails;
    });
    const final = await [].concat.apply([], mapRes);
    return final;
  });
  const resCukcuk = await Promise.all(cukcukRes).then((result) => {
    return result;
  });
  const cukcukOrder = resCukcuk.flat();
  cukcukOrder?.forEach((order) => {
    todayRevenue += order.Price * order.Quantity;
    return todayRevenue;
  });

  const compareTodayOrderWithProduct = cukcukOrder?.map((e) => {
    const obj = products?.find((product) => product.name === e.ItemName);
    if (!obj) {
      missingProduct = [...missingProduct, e?.ItemName];
      return { ...e, cost: 0 };
    } else {
      return { ...e, cost: obj?.cost };
    }
  });

  compareTodayOrderWithProduct?.forEach((order) => {
    todayCost += parseFloat(order?.cost);
    return todayCost;
  });
  const todayProfit = todayRevenue - todayCost;
  // get yesterday order
  const orderByYesterday = await cukcukOrders.data.Data.filter((e) => {
    return (
      moment(e.Date).format("YYYY-MM-DD") ===
      moment(yesterday).format("YYYY-MM-DD")
    );
  });

  const yesterdayIdList = await orderByYesterday?.map((e) => e.Id);

  const yesterdayCukcukRes = await yesterdayIdList?.map(async (id) => {
    let orderDetails = [];
    const res = await cukcukApi.get(`/v1/orders/${id}`);
    orderDetails.push(res.data.Data);
    const mapRes = orderDetails.map((e) => {
      return e.OrderDetails;
    });
    const final = await [].concat.apply([], mapRes);
    return final;
  });

  const resCukcukYesterday = await Promise.all(yesterdayCukcukRes).then(
    (result) => {
      return result;
    }
  );

  const yesterdayCukcukOrder = resCukcukYesterday.flat();
  yesterdayCukcukOrder?.forEach((order) => {
    yesterdayRevenue += order.Price * order.Quantity;
    return yesterdayRevenue;
  });

  const compareYesterdayOrderWithProduct = yesterdayCukcukOrder?.map((e) => {
    const obj = products?.find((product) => product.name === e.ItemName);
    if (!obj) {
      missingProduct = [...missingProduct, e?.ItemName];
      return { ...e, cost: 0 };
    } else {
      return { ...e, cost: obj?.cost };
    }
  });

  compareYesterdayOrderWithProduct?.forEach((order) => {
    yesterdayCost += parseFloat(order?.cost);
    return yesterdayCost;
  });
  const yesterdayProfit = yesterdayRevenue - yesterdayCost;

  return sendResponse(
    res,
    200,
    true,
    {
      products,
      Orders,
      todayRevenue,
      todayProfit,
      yesterdayRevenue,
      yesterdayProfit,
      missingProduct,
    },
    null,
    ""
  );
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
    supplier,
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
    supplier,
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
    const users = await User.find({ ...filter });
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
    if (supplier) {
      const supp = await Supplier.findOne({ name: supplier }).exec();
      if (!supp) {
        await Supplier.create({
          name: supplier,
          email: "",
          phone: "",
          link: "",
          products: [product._id],
        });
      } else {
        const suppArr = supp.products;
        const updateSuppArr = suppArr.concat([product._id]);
        await Supplier.findByIdAndUpdate(supp._id, { products: updateSuppArr });
      }
    }
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
    supplier,
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
    capacityUnit = "";
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId },
    {
      name,
      supplier,
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
  if (
    product.type === "Beer" ||
    product.type === "Alcohol" ||
    product.type === "Ingredient"
  ) {
    const stock = await Stock.findOneAndDelete({ product: id }).exec();
    await Stock.deleteMany({ product: id });
    const order = await Order.findOne({ author: stock.author }).exec();
    const stockArr = order.stocks;
    const filtered = stockArr.filter(function (value) {
      return !value.equals(stock._id);
    });
    await Order.updateMany({}, { stocks: filtered });
  }
  const supplier = product.supplier;
  if (supplier !== "") {
    const suppObj = await Supplier.findOne({ name: supplier }).exec();
    const suppArr = suppObj.products;
    const filteredSupp = suppArr.filter(function (value) {
      return !value.equals(id);
    });

    await Supplier.findOneAndUpdate(
      { name: supplier },
      { products: filteredSupp }
    );
  }

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
