const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = Schema(
  {
    stocks: [{ type: Schema.Types.ObjectId, required: true, ref: "Stock" }],
    author: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

orderSchema.plugin(require("./plugins/isDeletedFalse"));

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
