const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stockSchema = Schema(
  {
    product: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    yesterdayStock: { type: Number, default: 0 },
    stockIn: { type: Number, default: 0 },
    stockOut: { type: Number, default: 0 },
    estimate: { type: Number, default: 0 },
    real: { type: Number, default: 0 },
    note: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

stockSchema.plugin(require("./plugins/isDeletedFalse"));

const Stock = mongoose.model("Stock", stockSchema);
module.exports = Stock;
