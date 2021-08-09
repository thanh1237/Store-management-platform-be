const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Order = require("../models/Order");
const Supplier = require("../models/Supplier");
const supplierController = {};

supplierController.getSupplier = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 100000000000;

  const totalNumSupp = await Supplier.find({ ...filter }).countDocuments();
  const totalPages = Math.ceil(totalNumSupp / limit);
  const offset = limit * (page - 1);
  const suppliers = await Supplier.find({ ...filter })
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate({
      path: "products",
      populate: { path: "products" },
    });
  return sendResponse(
    res,
    200,
    true,
    { suppliers, totalPages },
    null,
    "Get suppliers success"
  );
});

supplierController.createSupplier = catchAsync(async (req, res, next) => {
  let { name, email, phone, link, products } = req.body;
  const supplier = await Supplier.create({
    name,
    email,
    phone,
    link,
    products,
  });
  return sendResponse(
    res,
    200,
    true,
    { supplier },
    null,
    "Create Supplier Successful"
  );
});

supplierController.updateSupplier = catchAsync(async (req, res, next) => {
  const supplierId = req.params.id;
  let { name, email, phone, link, products } = req.body;

  const supplier = await Supplier.findOneAndUpdate(
    { _id: supplierId },
    {
      name,
      phone,
      email,
      link,
      products,
    },
    { new: true }
  );
  if (!supplier)
    return next(
      new AppError(
        400,
        "Supplier not found or User not authorized",
        "Update Supplier Error"
      )
    );
  return sendResponse(
    res,
    200,
    true,
    { supplier },
    null,
    "Update Supplier Successful"
  );
});

supplierController.deleteSupplier = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const supplier = await Supplier.findOneAndDelete({ _id: id });

  if (!supplier)
    return next(
      new AppError(
        400,
        "Supplier not found or User not authorized",
        "Delete Supplier Error"
      )
    );
  return sendResponse(res, 200, true, null, null, "Delete supplier successful");
});

supplierController.getSupplierId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const supplier = await Supplier.findById(id).populate("products");
  if (!supplier)
    return next(
      new AppError(400, "Supplier not found", "Get supplier by id Error")
    );
  return sendResponse(
    res,
    200,
    true,
    supplier,
    null,
    "Get supplier successfully"
  );
});

module.exports = supplierController;
