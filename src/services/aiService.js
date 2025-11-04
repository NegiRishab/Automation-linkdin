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
You are an experienced software engineer documenting your daily developer grind on LinkedIn — sharing authentic, consistent updates that reflect real progress, learning, and persistence.

Write a short (120–180 words) LinkedIn post using the following engineering log:

Day: \${timelineItem.day}
Phase: \${timelineItem.phase}
Topic: \${timelineItem.topic}
Today's Task: \${timelineItem.todayTask}
Challenges: \${timelineItem.challenges}

🎯 Goal:
Craft a visually appealing, human post that looks like part of a daily "build in public" series. It should feel thoughtful, useful, and show steady momentum — like a developer sharing their journey, not marketing.

🪄 Style & Formatting Rules:
- Start with a dynamic day header like:
  💻 Day \${timelineItem.day} — [short motivational or progress phrase]  
  Examples:  
  - 💻 Day 5 — Keeping the Streak Alive  
  - ⚙️ Day 3 — Deep in the Code Grind  
  - 🚀 Day 7 — Consistency Over Intensity  
  - 🧠 Day 10 — Learning by Building  

- Add a **title line** related to today's topic or task:
  🔧 \${timelineItem.topic}  
  or  
  🛠️ \${timelineItem.todayTask}

- Then follow this structure:
  🧩 **Focus —** Describe what you worked on today and why it mattered.  
  🚧 **Challenge —** Explain the main technical or design struggle you faced.  
  💡 **Lesson —** Share what you learned, improved, or realized.  

- Use **bold** selectively for key technologies, tools, or insights (e.g., **NestJS**, **TypeORM**, **PostgreSQL**, **Redis**, **DTOs**).  
  Keep emphasis balanced — 5–8 bolded words total for readability.

- End with a natural, human reflection or observation (avoid AI-style “Feeling accomplished…” lines).  
  Examples:  
  - "Still amazed how much clarity comes after untangling messy logic."  
  - "This part took longer than planned, but the architecture feels right now."  
  - "Small wins like this make the grind worthwhile."  
  - "Tomorrow, I’ll tackle the integration tests — excited to see it all connect."  
  Then close with a short, friendly discussion question prefixed by 🤔.

✨ Writing Style:
- Short paragraphs (1–3 lines).  
- 3–5 emojis total — subtle, not flashy.  
- Bold key points and section labels for scannability.  
- Tone: authentic, curious, humble — developer-to-developer.  
- No hashtags or marketing fluff.  
- Leave clean blank lines for readability.

📘 Example Output:
---
💻 Day 2 — Building the Backbone of Our App  

🔧 Database Schema Design  

🧩 **Focus —**  
Spent the day designing the **PostgreSQL** schema to manage structured data like **users**, **organizations**, and **tasks**. Using **TypeORM** made mapping these entities to **NestJS** models smoother and kept migrations predictable. For chat messages and logs, **MongoDB** handled the unstructured data side perfectly.

🚧 **Challenge —**  
Maintaining consistency between **PostgreSQL** and **MongoDB** was more complex than expected. I had to clearly define data ownership and add lightweight transaction logic to keep both sides in sync.

💡 **Lesson —**  
Separating responsibilities across databases brought clarity — each system does what it’s best at, without stepping on the other’s toes.

This part took longer than planned, but the structure finally feels right.  
🤔 Have you ever mixed SQL and NoSQL in one project? How did you handle it?
---
Now, generate the full LinkedIn post following this tone, structure, and visual style.
`;




  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1000,
    });

    let rawOutput = completion.choices?.[0]?.message?.content?.trim();
    if (!rawOutput) throw new Error("Empty response from AI model.");

    // 🧹 Optional: clean markdown code block fences (if any)
    rawOutput = rawOutput.replace(/^```(?:\w+)?/i, "").replace(/```$/, "").trim();

    return rawOutput; // ✅ return the post text directly
  } catch (err) {
    console.error("❌ Error generating post:", err.message);
    if (err.response?.data) console.error(err.response.data);
    throw err;
  }
};

