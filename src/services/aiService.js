import dotenv from "dotenv";
import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateTimeline = async (projectDescription) => {
  const prompt = `
You are a senior software engineer and AI project planner. 
Your job is to generate a realistic, professional, and human-like 30-day development timeline for the project described below.

The timeline should read like real engineering progress logs — as if written daily by a mid-level to senior software engineer (3+ years experience) building this project.

---
${JSON.stringify(projectDescription, null, 2)}
---

🧠 Strict Instructions:
- Use ONLY the details provided in the project description. 
- Do NOT invent new tools, features, or services.
- Each day must describe specific, meaningful technical progress.
- Mention *how* the engineer solved the task (libraries, tools, or patterns used), and *why* those decisions were made.
- Describe real challenges — architectural, performance, dependency, or integration issues — and how they were approached.
- Maintain continuity: each day builds upon the previous day's progress.
- Keep the tone natural, reflective, and technical — like a real engineer documenting their daily work.
- Avoid vague filler terms like “setup environment”, “testing with users”, or “final review” unless they represent genuine work.

📅 Output JSON format:
[
  {
    "day": <number 1–30>,
    "phase": <main development phase>,
    "topic": <focus area of the day>,
    "previousDay": <summary of what was completed yesterday (or 'N/A' for Day 1)>,
    "todayTask": <detailed, human-like explanation (3–5 sentences) describing what was done today, how it was built, what decisions were made, and which tools or patterns were used>,
    "challenges": <specific technical or architectural blockers encountered and how they were approached (2–3 sentences)>
  }
]

Example entry:
{
  "day": 5,
  "phase": "Backend Development",
  "topic": "Task Workflow Module",
  "previousDay": "Completed organization and workspace module setup in MainService.",
  "todayTask": "Implemented task creation and assignment API using NestJS. Integrated PostgreSQL models for task ownership and relational mapping with organizations and users. Chose to use TypeORM decorators for cleaner entity relationships and easier schema migrations. Focused on maintaining transactional consistency when assigning tasks to multiple users.",
  "challenges": "Faced challenges maintaining data integrity across organization and user tables. Solved it by introducing explicit foreign key constraints and refining service-level validation logic to prevent circular dependencies."
}

⚠️ Important:
- Follow the actual tech stack (NestJS, Node.js, React, PostgreSQL, MongoDB, Redis, Socket.IO, Docker, etc.).
- Capture both **engineering logic** and **decision-making reasoning** — as if the author were reflecting on their daily dev log.
- Do NOT truncate or summarize content with ellipses (...). Write complete sentences for every field.
- Ensure each field ("previousDay", "todayTask", and "challenges") ends with a full stop.
- Return ONLY valid JSON (no markdown, no explanations, no extra commentary).
s
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 12000
    });


    let rawOutput = completion.choices?.[0]?.message?.content?.trim();
    if (!rawOutput) throw new Error("Empty response from OpenAI API.");

    // 🧹 Clean Markdown fences
    rawOutput = rawOutput.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    // 🧠 Extract JSON array
    const jsonString = rawOutput.match(/\[([\s\S]*)\]/)?.[0] || rawOutput;

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      console.warn("⚠️ Invalid JSON detected — attempting auto-repair...");
      parsed = JSON.parse(jsonrepair(jsonString));
    }

    if (!Array.isArray(parsed)) throw new Error("Parsed response is not a JSON array.");

    console.log(`🧠 Generated ${parsed.length} timeline entries.`);
    return parsed;
  } catch (err) {
    console.error("❌ Error generating timeline:", err.message);
    if (err.response?.data) console.error(err.response.data);
    throw err;
  }
};


export const generatePost = async (timelineItem) => {
  const prompt = `
You are an experienced software engineer who documents your daily progress on LinkedIn in a human, thoughtful way.
Write a short LinkedIn post (2–3 paragraphs, around 120–180 words) based on the following engineering log:

Phase: ${timelineItem.phase}
Topic: ${timelineItem.topic}
Today's Task: ${timelineItem.todayTask}
Challenges: ${timelineItem.challenges}

Your goal:
Create a post that feels personal, useful, and easy to read — something fellow engineers can learn from or relate to.

Formatting rules:
- Use short paragraphs (1–3 lines each).
- Add simple markdown-style headers for readability (e.g., “**Today’s focus:**”, “**Key challenge:**”, “**Reflection:**”).
- Leave a blank line between sections for visual breathing space.
- Avoid emojis, hashtags, or over-the-top excitement.
- Keep the tone conversational, humble, and insightful.
- Emphasize what was learned, not just what was done.
- End with a friendly, reflective question or invitation for discussion (e.g., “How do you approach this in your projects?”).

Example structure:
---
### 🚀 {Phase or Topic}

**Today’s focus:**  
Brief summary of what was worked on and why it mattered.

**Key challenge:**  
Explain what made it tricky and how you solved or approached it.

**Reflection:**  
Share a short insight or takeaway. End with a light question inviting others to share their thoughts.
---

Now, write the full LinkedIn post following this format and tone. Keep it genuine, easy to read, and technically meaningful.
`;
  return prompt;
};

