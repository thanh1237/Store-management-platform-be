const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supplierSchema = Schema(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    link: { type: String, require: false, default: "" },
    phone: { type: String, require: false, default: "" },
    products: [{ type: Schema.Types.ObjectId, ref: "Product", default: [] }],
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

const Supplier = mongoose.model("Supplier", supplierSchema);
module.exports = Supplier;
