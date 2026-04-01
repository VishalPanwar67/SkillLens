import mongoose from "mongoose";

const skillProfileSchema = new mongoose.Schema(
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
      // no enum — supports any skill you add later
    },
    depthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    depthLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    quizAttempts: {
      type: Number,
      default: 0,
    },
    lastAttempt: {
      type: Date,
      default: null,
    },
    weakFlag: {
      type: Boolean,
      default: false, // set true if interview keywords missed
    },
    skillXp: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

skillProfileSchema.index({ userId: 1, skill: 1 }, { unique: true });

const SkillProfile = mongoose.model("SkillProfile", skillProfileSchema);
export default SkillProfile;
