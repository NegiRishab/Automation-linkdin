import express from "express";
import cron from "node-cron";
import dotenv from "dotenv";
import { runDailyPoster } from "./jobs/dailyPoster.js";
import { connectDB } from "./config/db.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

 await connectDB();
    console.log("✅ Connected to MongoDB");
// 🩺 Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LinkedIn automation backend is running 🚀",
    time: new Date().toISOString(),
  });
});

cron.schedule("31 11 * * *", async () => {
  console.log("🚀 Running daily LinkedIn poster job at 11:30 AM...");
  await runDailyPoster();
}, {
  timezone: "Asia/Kolkata", // ensures it runs at 11:30 AM IST
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

