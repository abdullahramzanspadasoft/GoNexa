const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/connectDB");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS Configuration
const frontendOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const corsOptions = {
  origin: frontendOrigins.length
    ? frontendOrigins
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests (Express v5 compatible)
app.options(/.*/, cors(corsOptions));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is running",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
