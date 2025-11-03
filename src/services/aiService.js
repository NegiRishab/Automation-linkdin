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

Day: ${timelineItem.day}
Phase: ${timelineItem.phase}
Topic: ${timelineItem.topic}
Today's Task: ${timelineItem.todayTask}
Challenges: ${timelineItem.challenges}

🎯 Goal:
Craft a visually appealing, human post that looks like part of a daily "build in public" series. It should feel thoughtful, useful, and show steady momentum.

🪄 Style & Formatting Rules:
- Start with a dynamic day header like:
  💻 **Day ${timelineItem.day} — [short motivational or progress phrase]**
  Examples:  
  - 💻 **Day 5 — Keeping the Streak Alive**  
  - ⚙️ **Day 3 — Deep in the Code Grind**  
  - 🚀 **Day 7 — Consistency Over Intensity**  
  - 🧠 **Day 10 — Learning by Building**  

- Immediately after, add a bold or italic **title line** related to today's topic or task, e.g.:
  🔧 *${timelineItem.topic}*  
  or  
  🛠️ **${timelineItem.todayTask}**

- Then, use the following clean structure:
  🧩 **Focus —** Describe what you worked on today and why it mattered.  
  🚧 **Challenge —** Explain the main technical or design struggle you faced.  
  💡 **Lesson —** Share what you learned, improved, or realized.  

- End with 1–2 lines reflecting your daily progress and commitment, then add a light, friendly question prefixed with 🤔 to invite discussion.

✨ Writing Style:
- Keep paragraphs short (1–3 lines each).  
- Use 3–5 emojis total for visual rhythm — subtle, not flashy.  
- Keep tone authentic, humble, and curious — not promotional.  
- Use **bold** for key terms (e.g., tools, frameworks, insights).  
- Avoid hashtags, excessive punctuation, or hype language.  
- Leave blank lines between sections for readability.  

📘 Example Output:
---
💻 **Day 5 — Keeping the Streak Alive**

🔧 **Building the Foundations for Microservices**

🧩 **Focus —**  
Today was all about laying the groundwork for **DevSync’s MainService** and **ChatService** using **NestJS** and **Node.js**. I integrated **Redis Pub/Sub** for smoother microservice communication — a choice that boosts speed and reliability for real-time collaboration.

🚧 **Challenge —**  
Defining clear service boundaries turned out trickier than expected. Each microservice needs to own its domain while still playing nicely with others. Finding that balance took some iteration and patience.

💡 **Lesson —**  
Creating clear **DTOs (Data Transfer Objects)** for each service contract helped clarify dependencies and streamline communication.

🔥 Day 5 done — consistency over intensity.  
🤔 How do you usually approach defining service boundaries in your projects?
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

