import { ApiResponse } from "../class/index.class.js";
import { asyncHandler } from "../utils/index.util.js";
import User from "../models/user.model.js";

/**
 * Ensures user gets 5 daily credits.
 * Resets if today's date is different from lastCreditReset.
 */
export const checkDailyCredits = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user) return next();

  const now = new Date();
  const lastReset = new Date(user.lastCreditReset || 0);

  // Check if reset is needed (different day)
  const isDifferentDay =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getDate() !== lastReset.getDate();

  if (isDifferentDay) {
    if (user.credits < 5) {
      user.credits = 5; 
    }
    user.lastCreditReset = now;
    await user.save();
  }

  next();
});

/**
 * Deducts specified credits from user.
 * Blocks if insufficient.
 */
export const consumeCredits = (amount) => asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (user.credits < amount) {
    return res.status(403).json(
      new ApiResponse(403, `Insufficient credits. You need ${amount} credits but only have ${user.credits}. Buy more or wait for daily reset.`, {
        needsCredits: true,
        currentCredits: user.credits,
        requiredCredits: amount
      })
    );
  }

  user.credits -= amount;
  await user.save();
  next();
});
