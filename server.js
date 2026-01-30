import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./src/config/connectDB.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Keep the process running
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
