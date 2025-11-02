import express from "express";
import cron from "node-cron";
import dotenv from "dotenv";
import { runDailyPoster } from "./jobs/dailyPoster.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🩺 Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LinkedIn automation backend is running 🚀",
    time: new Date().toISOString(),
  });
});

// 🕒 Daily cron job (runs every day at 9:00 AM)
cron.schedule("0 9 * * *", async () => {
  console.log("🚀 Running daily LinkedIn poster job...");
  await runDailyPoster();
});

// Optional: manual trigger route (for debugging)
app.get("/run-daily", async (req, res) => {
  console.log("⚙️ Manually running daily poster...");
  await runDailyPoster();
  res.json({ status: "ok", message: "Daily job executed manually" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});

