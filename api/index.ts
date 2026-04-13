import "dotenv/config";
/**
 * Vercel runs `pnpm build` → emits `dist/`. Importing `../src/app.js` never works
 * in production because only `dist/` exists after tsc.
 */
import app from "../dist/app.js";

export default app;
