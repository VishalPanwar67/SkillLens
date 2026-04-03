import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRouters from "./routes/auth.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import companyRoutes from "./routes/companyRoutes.js";
import roadmapRoutes from "./routes/roadmap.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import skillRoadmapRoutes from "./routes/skillRoadmap.routes.js";
import customTargetRoutes from "./routes/customTarget.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const PORT = process.env.PORT;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-gemini-key"],
  })
);

// Special handling for Stripe Webhook (needs raw body)
// Must be BEFORE express.json()
app.post("/api/payment/webhook", express.raw({ type: 'application/json' }), (req, res, next) => {
  // Pass to router later if preferred, or handle here. 
  // Let's pass it through.
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const publicDir = path.join(__dirname, "../public");
if (fs.existsSync(publicDir)) {
  app.use("/public", express.static(publicDir));
}

// ─── Routes ───────
app.use("/api/auth", authRouters);
app.use("/api/resume", resumeRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/skill-roadmap", skillRoadmapRoutes);
app.use("/api/custom-hiring", customTargetRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export { app };
