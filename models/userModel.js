const mongoose = require("mongoose");

// Define a schema and model
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
