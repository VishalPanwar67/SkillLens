import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { 
  getSkillRoadmap, 
  toggleTaskProgress,
  toggleProjectStatus,
  generateDailyPlan,
  handleMockInterview 
} from "../controllers/skillRoadmap.controllers.js";

const skillRoadmapRoutes = Router();

skillRoadmapRoutes.get("/", protectRoute, getSkillRoadmap);
skillRoadmapRoutes.post("/progress", protectRoute, toggleTaskProgress);
skillRoadmapRoutes.post("/project-progress", protectRoute, toggleProjectStatus);
skillRoadmapRoutes.post("/daily-plan", protectRoute, generateDailyPlan);
skillRoadmapRoutes.post("/mock-interview", protectRoute, handleMockInterview);

export default skillRoadmapRoutes;
