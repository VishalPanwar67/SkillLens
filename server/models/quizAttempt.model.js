import mongoose from "mongoose";

const questionReviewSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    skill: { type: String, required: true },
    difficulty: { type: String, default: "medium" },
    selectedIndex: { type: Number, required: true },
    correctIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "" },
    skills: [{ type: String, lowercase: true }],
    overallPercent: { type: Number, required: true },
    totalCorrect: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    timeSpentSeconds: { type: Number, default: null },
    skillResults: { type: [mongoose.Schema.Types.Mixed], default: [] },
    questionReviews: [questionReviewSchema],
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, createdAt: -1 });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
