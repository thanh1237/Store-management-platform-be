const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const validators = require("../middlewares/validators");
const authentication = require("../middlewares/authentication");
const { body } = require("express-validator");
/**
 * @route POST api/users
 * @description Register new user
 * @access Public
 */
router.post(
  "/",
  validators.validate([
    body("name", "Invalid name").exists().notEmpty(),
    body("email", "Invalid email").exists().isEmail(),
    body("password", "Invalid password").exists().notEmpty(),
  ]),
  userController.register
);
/**
 * @route PUT api/users/
 * @description Change password
 * @access Login required
 */

/**
 * @route GET api/users/me
 * @description Get current user info
 * @access Login required
 */
router.get("/me", authentication.loginRequired, userController.getCurrentUser);

/**
 * @route GET api/users?page=1&limit=10
 * @description Get users with pagination
 * @access Login required
 */
router.get("/", userController.getUsers);

/**
 * @route DELETE api/user/:id
 * @description DELETE user
 * @access Login required
 */
router.delete("/:id", authentication.loginRequired, userController.deleteUser);

/**
 * @route PUT api/users/
 * @description UPDATE current user info
 * @access Login required
 */
router.put("/:id", authentication.loginRequired, userController.changePassword);

module.exports = router;
