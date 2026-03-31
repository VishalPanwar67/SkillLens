import mongoose from "mongoose";

const stepSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    estimatedTime: { type: String, required: true },
    youtubeLink: { type: String, default: "" },
    docLink: { type: String, default: "" },
    projectIdea: { type: String, default: "" },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Expert"], default: "Beginner" },
    outcome: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "Conceptual"], default: "Conceptual" },
    options: [{ type: String }], // Only for MCQ
    answer: { type: String, required: true },
  },
  { _id: false }
);

const skillRoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    steps: [stepSchema],
    projects: [projectSchema],
    questions: [questionSchema],
    videos: [
      {
        thumbnail: String,
        title: String,
        channelName: String,
        videoId: String,
      },
    ],
    overallProgress: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure a user can only have one roadmap per skill
skillRoadmapSchema.index({ userId: 1, skill: 1 }, { unique: true });

const SkillRoadmap = mongoose.model("SkillRoadmap", skillRoadmapSchema);
export default SkillRoadmap;
