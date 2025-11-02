import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  phase: { type: String, required: true },
  topic: { type: String, required: true },
  previousDay: { type: String, default: "N/A" },
  todayTask: { type: String, required: true },
  challenges: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "posted"],
    default: "pending",
  },
});

export const Post = mongoose.model("Post", postSchema);
