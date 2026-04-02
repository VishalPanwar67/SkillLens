import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createCheckoutSession, handleWebhook, verifySession } from "../controllers/payment.controller.js";
import express from "express";

const router = Router();

// Endpoint to start checkout
router.post("/checkout", protectRoute, createCheckoutSession);
router.get("/verify-session", protectRoute, verifySession);

// Endpoint for webhook (must use express.raw for verify)
router.post("/webhook", express.raw({ type: 'application/json' }), handleWebhook);

export default router;
