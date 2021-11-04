const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Product = require("../models/Product");
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
  let { date, mode } = req.body;

  let missingProduct = [];
  let todayRevenue = 0;
  let todayCost = 0;
  let yesterdayRevenue = 0;
  let yesterdayCost = 0;
  const cukCukDate = new Date();

  const yesterday = moment().subtract(1, "days");
  const products = await Product.find({ ...filter });
  const stocks = await Stock.find({ ...filter }).populate("product");
  const users = await User.find({ ...filter });
  const admin = users.find((e) => {
    return e.role === "Admin";
  });

  const nonAdminStocks = stocks.filter((e) => {
    return !e.author.equals(admin._id);
  });
  const todayStock = nonAdminStocks.filter((e) => {
    return (
      moment(e.createdAt).format("YYYY-MM-DD") ===
      moment(yesterday).format("YYYY-MM-DD")
    );
  });

  const appSecret = process.env.REACT_APP_SECRET_KEY;
  const string = JSON.stringify({
    AppID: "CUKCUKOpenPlatform",
    Domain: "bake",
    LoginTime: cukCukDate,
  });
  const hash = crypto
    .createHmac("sha256", appSecret)
    .update(string)
    .digest("hex");
  const cukcuk = await cukcukApi.post("/Account/Login", {
    AppID: "CUKCUKOpenPlatform",
    Domain: "bake",
    LoginTime: cukCukDate,
    SignatureInfo: hash,
  });

  const cukcukOrders = await cukcukApi.post("/v1/orders/paging", {
    Page: 1,
    Limit: 100,
    BranchId: null,
    HaveCustomer: true,
  });
  const Orders = cukcukOrders.data.Data;
  if (mode === "Date") {
    const orderByDate = await Orders.filter((e) => {
      return (
        moment(e.Date).format("YYYY-MM-DD") ===
        moment(date).format("YYYY-MM-DD")
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

    // TODO STOCK
    const bthItems = cukcukOrder?.filter((e) => {
      return e.UnitName === "Chai";
    });

    const dishAndGlassItems = cukcukOrder?.filter((e) => {
      return e.UnitName !== "Chai";
    });

    const bth = bthItems?.map((params) => {
      const obj = todayStock.find((e) => {
        return e.product.name === params.ItemName;
      });
      return { obj, sold: params.Quantity };
    });

    const reduceBth = bth.reduce((total, item) => {
      let itemArr = total.map((e) => e.obj.product._id);
      if (!itemArr.includes(item.obj.product._id)) {
        return [...total, item];
      } else if (itemArr.includes(item.obj.product._id)) {
        const obj = total.find((e) => {
          if (e.obj.product._id === item.obj.product._id) {
            return { ...e, sold: item.sold };
          }
        });
        const index = total.findIndex(
          (e) => e.obj.product._id === item.obj.product._id
        );
        total[index].sold += obj.sold;
      }
      return total;
    }, []);
    reduceBth.forEach(async (e) => {
      try {
        if (e) {
          await Stock.findByIdAndUpdate(
            { _id: e.obj._id },
            {
              product: e.obj.product._id,
              order: e.obj.order,
              author: e.obj.author,
              start: e.obj.start,
              stockIn: e.obj.stockIn,
              stockOut: e.obj.stockOut,
              estimate: Number(e.sold),
              real: e.obj.real,
              orderNeeded: e.obj.orderNeeded,
              orderQuantity: e.obj.orderQuantity,
              note: e.obj.note,
            },
            {
              new: true,
            }
          );
        } else {
          return;
        }
      } catch (error) {
        console.log(error);
      }
    });

    let dishOrGlass = dishAndGlassItems?.map((params) => {
      const obj = products.find((e) => {
        return e.name === params.ItemName;
      });
      const ingredient = obj?.ingredients;
      const final = ingredient?.map((ele) => {
        return { ele, sold: params.Quantity * ele.consumption };
      });
      return final;
    });

    const merge = dishOrGlass?.flat();

    const ing = merge?.map((params) => {
      const obj = todayStock.find((e) => {
        return e.product.name === params?.ele.ingredient;
      });

      return { obj, sold: params?.sold };
    });
    const reduceIng = ing.reduce((total, item) => {
      if (item.obj !== undefined) {
        let itemArr = total.map((e) => e.obj.product._id);
        if (!itemArr?.includes(item.obj.product._id)) {
          return [...total, item];
        } else if (itemArr?.includes(item.obj.product._id)) {
          const obj = total.find((e) => {
            if (e.obj.product._id === item.obj.product._id) {
              return { ...e, sold: item.sold };
            }
          });
          const index = total?.findIndex(
            (e) => e.obj.product._id === item.obj.product._id
          );
          total[index].sold += obj.sold;
        }
        return total;
      } else {
        return total;
      }
    }, []);
    reduceIng.forEach(async (e) => {
      try {
        if (e.obj) {
          await Stock.findByIdAndUpdate(
            { _id: e?.obj?._id },
            {
              product: e.obj?.product?._id,
              order: e.obj.order,
              author: e.obj.author,
              start: e.obj.start,
              stockIn: e.obj.stockIn,
              stockOut: e.obj.stockOut,
              estimate:
                Math.round(
                  (1 - Number(e.sold) / Number(e.obj.product.capacity)) * 100
                ) / 100,
              real: e.obj.real,
              orderNeeded: e.obj.orderNeeded,
              orderQuantity: e.obj.orderQuantity,
              note: e.obj.note,
            },
            {
              new: true,
            }
          );
        } else {
          return;
        }
      } catch (error) {
        console.log(error);
      }
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
  } else if (mode === "Month") {
    const orderByDate = await Orders.filter((e) => {
      return (
        moment(e.Date).format("YYYY-MM") === moment(date).format("YYYY-MM")
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

    // TODO STOCK
    let estimate;

    const bthItems = cukcukOrder?.filter((e) => {
      return e.UnitName === "Chai";
    });
    const dishAndGlassItems = cukcukOrder?.filter((e) => {
      return e.UnitName !== "Chai";
    });
    const bth = bthItems?.map((params) => {
      const obj = todayStock.find((e) => {
        return e.product.name === params.ItemName;
      });

      return { obj, sold: params.Quantity };
    });
    bth.forEach(async (e) => {
      try {
        if (e) {
          await Stock.findByIdAndUpdate(
            { _id: e.obj._id },
            {
              product: e.obj.product._id,
              order: e.obj.order,
              author: e.obj.author,
              start: e.obj.start,
              stockIn: e.obj.stockIn,
              stockOut: e.obj.stockOut,
              estimate: Number(e.sold),
              real: e.obj.real,
              orderNeeded: e.obj.orderNeeded,
              orderQuantity: e.obj.orderQuantity,
              note: e.obj.note,
            },
            {
              new: true,
            }
          );
        } else {
          return;
        }
      } catch (error) {
        console.log(error);
      }
    });

    let dishOrGlass = dishAndGlassItems?.map((params) => {
      let res;
      const obj = products.find((e) => {
        if (e.name === params.ItemName) {
          res = e;
        }
        return res;
      });
      const ingredient = res?.ingredients;
      const final = ingredient?.map((ele) => {
        return { ele, sold: params.Quantity * ele.consumption };
      });
      return final;
    });
    const merge = dishOrGlass?.flat();

    const ing = merge?.map((params) => {
      const obj = todayStock.find((e) => {
        return e.product.name === params?.ele.ingredient;
      });

      return { obj, sold: params?.sold };
    });
    ing.forEach(async (e) => {
      try {
        if (e.obj) {
          await Stock.findByIdAndUpdate(
            { _id: e?.obj?._id },
            {
              product: e.obj?.product?._id,
              order: e.obj.order,
              author: e.obj.author,
              start: e.obj.start,
              stockIn: e.obj.stockIn,
              stockOut: e.obj.stockOut,
              estimate: -Number(e.sold),
              real: e.obj.real,
              orderNeeded: e.obj.orderNeeded,
              orderQuantity: e.obj.orderQuantity,
              note: e.obj.note,
            },
            {
              new: true,
            }
          );
        } else {
          return;
        }
      } catch (error) {
        console.log(error);
      }
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
        moment(e.Date).format("YYYY-MM") === moment(yesterday).format("YYYY-MM")
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
  }
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
