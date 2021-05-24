const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const userSchema = Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatarUrl: { type: String, require: false, default: "" },
    password: { type: String, required: true },
    emailVerificationCode: { type: String, select: false },
    emailVerified: { type: Boolean, require: true, default: false },
    isDeleted: { type: Boolean, default: false, select: false },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Rooftop", "Rock", "Acoustic", "Rap"],
    },
  },
  { timestamps: true }
);

userSchema.plugin(require("./plugins/isDeletedFalse"));

userSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.emailVerified;
  delete obj.emailVerificationCode;
  delete obj.isDeleted;
  return obj;
};

userSchema.methods.generateToken = async function () {
  const accessToken = await jwt.sign({ _id: this._id }, JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  return accessToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
