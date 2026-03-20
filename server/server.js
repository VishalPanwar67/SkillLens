import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve files from a `public/` folder if it exists.
const publicDir = path.join(__dirname, "../public");
if (fs.existsSync(publicDir)) {
  app.use("/public", express.static(publicDir));
}

// ✅ Add routes here later
// app.use("/api/v1/users", userRoutes);

app.use(errorHandler); // MUST be last

export { app };
