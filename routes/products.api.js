const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
/**
 * @route POST api/products?page=1&limit=10
 * @description Get product with pagination
 * @access Public
 */
router.post("/", productController.getProducts);

/**
 * @route GET api/products/:id
 * @description Get a single product
 * @access Public
 */
router.get("/:id", productController.getProductId);
/**
 
 * @route POST api/products
 * @description Create a new product
 * @access Login required
 */

router.post("/createProduct", productController.createProduct);

/**
 * @route PUT api/products/:id
 * @description Update a product
 * @access Login required
 */
router.put("/:id", productController.updateProduct);
/**
 * @route DELETE api/products/:id
 * @description Delete a product
 * @access Login required
 */
router.delete("/:id", productController.deleteProduct);

module.exports = router;
