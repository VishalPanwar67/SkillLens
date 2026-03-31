import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { acceptResumeUpload } from "../middleware/upload.middleware.js";
import { uploadResume, analyzeCurrent } from "../controllers/resume.controllers.js";

const resumeRoutes = Router();

resumeRoutes.post(
  "/upload",
  protectRoute,
  acceptResumeUpload,
  uploadResume
);

resumeRoutes.post("/analyze-current", protectRoute, analyzeCurrent);

export default resumeRoutes;
