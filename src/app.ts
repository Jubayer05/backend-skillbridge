import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import { authClient } from "./lib/auth.js";
import router from "./routes/index.js";

const app: Application = express();

app.use(express.json());

// Strip trailing slash to avoid CORS header mismatch between
// "https://example.com" (browser Origin) and "https://example.com/" (env var)
const frontendOrigin = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);

// Mount the Better Auth handler before other middleware that parses bodies
app.all("/api/auth/*splat", toNodeHandler(authClient));

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
