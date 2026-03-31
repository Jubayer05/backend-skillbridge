import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = process.env.PORT || 8000;

async function server() {
  try {
    await prisma.$connect();
    console.log("Connected to database successfully 🚀");

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
    });

    server.on("error", (error: any) => {
      console.error("Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
      }
    });
  } catch (error) {
    await prisma.$disconnect();
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
}

server();
