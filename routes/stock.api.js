const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stock.controller");
/**
 * @route GET api/orders?page=1&limit=10
 * @description Get report with pagination
 * @access Public
 */
router.get("/", stockController.getStocks);

// /**
//  * @route GET api/orders/:id
//  * @description Get a single report
//  * @access Public
//  */
// router.get("/:id", reportController.getReportId);
/**
 * @route POST api/order
 * @description Create a new order
 * @access Login required
 */
router.post("/", stockController.createStock);

/**
 * @route PUT api/stocks/:id
 * @description Update a stock
 * @access Login required
 */
router.put("/", stockController.updateStock);
// /**
//  * @route DELETE api/reports/:id
//  * @description Delete a report
//  * @access Login required
//  */
// router.delete("/:id", reportController.deleteReport);

module.exports = router;
