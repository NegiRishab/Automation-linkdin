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
  res.status(200).send("ok");
});

app.get("/health/details", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LinkedIn automation backend is running 🚀",
    time: new Date().toISOString(),
  });
});

cron.schedule("0 13 * * 1-5", async () => {
  console.log("🚀 Running daily LinkedIn poster job at 1:00 PM IST (Mon–Fri)...");
  await runDailyPoster();
}, {
  timezone: "Asia/Kolkata", // ensures 1:00 PM India time
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

