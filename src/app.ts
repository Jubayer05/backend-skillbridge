import cookieParser from "cookie-parser";
import express, { type Application } from "express";
import cors from "cors";
import router from "./routes";

const app: Application = express();

// app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1", router);

// Health check routes
app.get("/api/v1/health", (req, res) => {
  console.log("Health check endpoint called - /api/v1/health");
  res.status(200).json({ message: "OK", timestamp: new Date().toISOString() });
});

// Express 5 compatible catch-all pattern
// app.use(notFoundHandler);

export default app;
