const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    unit: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    cost: { type: Number, default: 0, required: true },
    capacity: { type: Number, default: 0 },
    capacityUnit: { type: String, default: "ml" },
    type: {
      type: String,
      required: true,
      enum: [
        "Cocktail",
        "Beer",
        "Mocktail",
        "Spirit",
        "Alcohol",
        "Ingredient",
        "Food",
      ],
    },
    ingredients: [
      {
        ingredient: { type: String },
        unit: { type: String },
        consumption: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
        capacity: { type: Number, default: 0 },
      },
    ],
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

productSchema.plugin(require("./plugins/isDeletedFalse"));

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
