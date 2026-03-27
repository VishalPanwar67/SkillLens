import mongoose from "mongoose";

const roadmapTaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    why: { type: String, required: true, trim: true },
    deliverable: { type: String, required: true, trim: true },
    estimateHours: { type: Number, required: true, min: 1, max: 8 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const roadmapWeekSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true, min: 1 },
    theme: { type: String, required: true, trim: true },
    goal: { type: String, required: true, trim: true },
    skillFocus: [{ type: String, trim: true, lowercase: true }],
    tasks: { type: [roadmapTaskSchema], default: [] },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    targetRole: { type: String, required: true, trim: true, lowercase: true },
    targetCompanyId: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    targetCompanyName: { type: String, default: null, trim: true },
    totalWeeks: { type: Number, required: true, min: 2, max: 16 },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    weeks: { type: [roadmapWeekSchema], default: [] },
    source: {
      type: String,
      enum: ["ai", "fallback"],
      default: "ai",
    },
  },
  { timestamps: true }
);

const Roadmap = mongoose.model("Roadmap", roadmapSchema);
export default Roadmap;
