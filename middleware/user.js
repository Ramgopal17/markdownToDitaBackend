const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "./.env" });
const jwt_secret = process.env.JWT_SECRET;
const User = require("../models/userModel");
const generateToken = require("./generateToken");

const verifyUser = async (req, res, next) => {
  if (!req.headers.token || req.headers.token === "null") {
    return res.status(401).json({
      message: "Token missing or invalid",
      status: 401,
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(req.headers.token, jwt_secret);
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
      status: 401,
    });
  }

  const { userId } = decodedToken;

  if (!userId) {
    return res.status(401).json({
      message: "Token does not contain a valid user ID",
      status: 401,
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }
    req.user = user;
    req.headers.token = generateToken(userId);
    next();
  } catch (err) {
    console.error("Error finding user:", err);
    return res.status(500).json({
      message: "Internal server error while verifying user",
      status: 500,
    });
  }
};

module.exports = verifyUser;
