import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  generateRoadmap,
  getRoadmap,
  toggleRoadmapTask,
  toggleRoadmapWeek,
} from "../controllers/roadmap.controllers.js";

const roadmapRoutes = Router();

roadmapRoutes.post("/generate", protectRoute, generateRoadmap);
roadmapRoutes.get("/", protectRoute, getRoadmap);
roadmapRoutes.patch("/:weekNumber/tasks/:taskId", protectRoute, toggleRoadmapTask);
roadmapRoutes.patch("/:weekNumber/complete", protectRoute, toggleRoadmapWeek);

export default roadmapRoutes;
