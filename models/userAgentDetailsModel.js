const mongoose = require("mongoose");

// Define a schema and model
const userAgentDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    email: { type: String },
    fileName: { type: String },
    ip: { type: String },
    browser: { type: String },
    os: { type: String },
  },
  { timestamps: true }
);

const LoginDetails = mongoose.model("File_history", userAgentDetailsSchema);

module.exports = LoginDetails;
