import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 8000;

async function main() {
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
    console.error(error);
    process.exit(1);
  }
}

main();
