const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplier.controller");

/**
 * @route GET api/suppliers?page=1&limit=10
 * @description Get supplier with pagination
 * @access Public
 */
router.get("/", supplierController.getSupplier);

/**
 * @route GET api/suppliers/:id
 * @description Get a single supplier
 * @access Public
 */
router.get("/:id", supplierController.getSupplierId);
/**
 * @route POST api/suppliers
 * @description Create a new supplier
 * @access Login required
 */
router.post("/", supplierController.createSupplier);

/**
 * @route PUT api/suppliers/:id
 * @description Update a supplier
 * @access Login required
 */
router.put("/:id", supplierController.updateSupplier);
/**
 * @route DELETE api/suppliers/:id
 * @description Delete a supplier
 * @access Login required
 */
router.delete("/:id", supplierController.deleteSupplier);

module.exports = router;
