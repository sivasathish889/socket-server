const mongoose = require("mongoose");
require("dotenv").config();
const dbServerCon = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
};
module.exports = dbServerCon;
