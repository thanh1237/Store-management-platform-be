const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stock.controller");
/**
 * @route GET api/stocks?page=1&limit=10
 * @description Get report with pagination
 * @access Public
 */
router.get("/", stockController.getStocks);

/**
 * @route POST api/stocks
 * @description Create a new stock
 * @access Login required
 */
router.post("/", stockController.createStock);

// /**
//  * @route PUT api/reports/:id
//  * @description Update a report
//  * @access Login required
//  */
// router.put("/:id", reportController.updateReport);
// /**
//  * @route DELETE api/reports/:id
//  * @description Delete a report
//  * @access Login required
//  */
// router.delete("/:id", reportController.deleteReport);

module.exports = router;
