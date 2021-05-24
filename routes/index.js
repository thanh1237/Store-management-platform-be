const express = require("express");
const router = express.Router();

// userApi
const userApi = require("./user.api");
router.use("/users", userApi);

// authApi
const authApi = require("./auth.api");
router.use("/auth", authApi);

// productsApi
const productApi = require("./products.api");
router.use("/products", productApi);

module.exports = router;
