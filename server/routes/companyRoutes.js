import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  getAllCompanies,
  getCompanyById,
  getCompanyGap,
  getAllCompanyGaps,
  getCustomBenchmark,
} from "../controllers/companyController.js";

const router = Router();

router.get("/", protectRoute, getAllCompanies);
router.get("/gaps", protectRoute, getAllCompanyGaps);
router.get("/:id/gap", protectRoute, getCompanyGap);
router.get("/:id", protectRoute, getCompanyById);
router.post("/custom-benchmark", protectRoute, getCustomBenchmark);

export default router;
