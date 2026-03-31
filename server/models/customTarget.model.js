import mongoose from "mongoose";

const customTargetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    roleTitle: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      default: "Custom Enterprise",
      trim: true,
    },
    about: {
      type: String,
      default: "User-defined custom hiring target.",
    },
    hiringProcess: {
      type: [String],
      default: ["Screening", "Interview", "Offer"],
    },
    requiredSkills: [
      {
        skill: { type: String, required: true, lowercase: true },
        minimumDepth: { type: Number, default: 50 },
        weight: { type: Number, default: 25 },
        focus: [String],
        testedVia: { type: String, default: "Interview" },
      },
    ],
    preferredSkills: [
      {
        skill: { type: String, required: true, lowercase: true },
        minimumDepth: { type: Number, default: 30 },
        weight: { type: Number, default: 10 },
      },
    ],
  },
  { timestamps: true }
);

const CustomTarget = mongoose.model("CustomTarget", customTargetSchema);
export default CustomTarget;
