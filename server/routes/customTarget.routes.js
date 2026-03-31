import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  createCustomTarget,
  getCustomTargets,
  deleteCustomTarget,
} from "../controllers/customTarget.controllers.js";

const router = Router();

router.post("/", protectRoute, createCustomTarget);
router.get("/", protectRoute, getCustomTargets);
router.delete("/:id", protectRoute, deleteCustomTarget);

export default router;
