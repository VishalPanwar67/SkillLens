import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    targetRole: {
      type: String,
      default: null,
      enum: ["frontend", "backend", "fullstack", "data", "java", null],
    },
    /** Last known skills from resume analysis (lowercase ids). Used as default quiz scope. */
    detectedSkills: {
      type: [String],
      default: [],
    },
    resumeText: {
      type: String,
      default: "",
    },
    lastResumeScore: {
      type: Number,
      default: 0,
    },
    readinessHistory: {
      type: [{ score: Number, date: { type: Date, default: Date.now } }],
      default: [],
    },
    profileImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "",
    },
    socials: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    xp: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      default: 5,
    },
    lastCreditReset: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
