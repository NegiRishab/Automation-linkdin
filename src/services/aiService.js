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


// export const generatePost = async (timelineItem) => {
//   const prompt = `
// You are an experienced software engineer documenting your daily developer grind on LinkedIn — sharing authentic, consistent updates that reflect real progress, learning, and persistence.

// Write a short (120–180 words) LinkedIn post using the following engineering log:

// Day: ${timelineItem.day}
// Phase: ${timelineItem.phase}
// Topic: ${timelineItem.topic}
// Today's Task: ${timelineItem.todayTask}
// Challenges: ${timelineItem.challenges}

// 🎯 Goal:
// Craft a visually appealing, human post that looks like part of a daily "build in public" series. It should feel thoughtful, useful, and show steady momentum — like a developer sharing their journey, not marketing.

// 🪄 Style & Formatting Rules:
// - Start with a dynamic day header like:
//   💻 Day ${timelineItem.day} — [short motivational or progress phrase]  
//   Examples:  
//   - 💻 Day 5 — Keeping the Streak Alive  
//   - ⚙️ Day 3 — Deep in the Code Grind  
//   - 🚀 Day 7 — Consistency Over Intensity  
//   - 🧠 Day 10 — Learning by Building  

// - Add a title line related to today's topic or task:
//   🔧 ${timelineItem.topic}  
//   or  
//   🛠️ ${timelineItem.todayTask}

// - Then follow this structure:
//   🧩 Focus — Describe what you worked on today and why it mattered.  
//   🚧 Challenge — Explain the main technical or design struggle you faced.  
//   💡 Lesson — Share what you learned, improved, or realized.  

// - Use natural LinkedIn-style emphasis for key words — capitalize or visually separate important tools, frameworks, or concepts (for example: NestJS, TypeORM, PostgreSQL, Redis, DTOs).  
//   Do NOT use markdown syntax like **text** or *text*.

// - End with a natural, human reflection or observation (avoid generic AI-like closers such as “Feeling accomplished…”).  
//   Example endings:  
//   - "Still amazed how much clarity comes after untangling messy logic."  
//   - "This part took longer than planned, but the architecture feels right now."  
//   - "Small wins like this make the grind worthwhile."  
//   - "Tomorrow, I’ll tackle the integration tests — excited to see it all connect."  
//   Then close with a short, friendly discussion question prefixed by 🤔.

// ✨ Writing Style:
// - Short paragraphs (1–3 lines).  
// - 3–5 emojis total — subtle, not flashy.  
// - Highlight key points using capitalization or spacing for readability.  
// - Tone: authentic, curious, humble — developer-to-developer.  
// - No hashtags, no markdown, no over-formatting.  
// - Leave clean blank lines between sections.

// 📘 Example Output:
// ---
// 💻 Day 3 — Deep in the Code Grind  

// 🔧 User Authentication  

// 🧩 Focus —  
// Today, I implemented secure user authentication in our MainService using NestJS Passport. I chose the JWT strategy for its stateless nature, which fits perfectly with our microservices architecture. I also focused on role-based access control to ensure users have proper permissions across the platform.

// 🚧 Challenge —  
// Integrating JWT across multiple microservices wasn’t straightforward. To solve it, I created a shared authentication module that centralizes token validation logic, making it reusable and easier to maintain.

// 💡 Lesson —  
// This reinforced the importance of modular design in distributed systems. Centralizing authentication simplified integration and boosted both security and clarity.

// Took a few late-night debugging sessions, but seeing smooth logins across services felt worth it.  
// 🤔 How do you usually manage authentication across your microservices?
// ---
// Now, generate the full LinkedIn post following this tone, structure, and visual style — without using any markdown symbols or formatting characters like ** or *.
// `;

//   try {
//     const completion = await client.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.6,
//       max_tokens: 1000,
//     });

//     let rawOutput = completion.choices?.[0]?.message?.content?.trim();
//     if (!rawOutput) throw new Error("Empty response from AI model.");

//     // 🧹 Clean up code fences or stray formatting
//     rawOutput = rawOutput
//       .replace(/^```(?:\w+)?/gm, "")
//       .replace(/```$/gm, "")
//       .replace(/\*\*/g, "") // remove markdown bold markers if any sneak in
//       .replace(/\*/g, "")   // remove stray single asterisks too
//       .trim();

//     return rawOutput; // ✅ Return clean LinkedIn post text
//   } catch (err) {
//     console.error("❌ Error generating post:", err.message);
//     if (err.response?.data) console.error(err.response.data);
//     throw err;
//   }
// };


export const generatePost = async (timelineItem) => {
  const prompt = `
You are an experienced software engineer documenting your daily developer grind on LinkedIn — sharing real, concise, and visually balanced updates that show genuine progress and learning.

Write a short (120–170 words) LinkedIn post using this log:

Day: ${timelineItem.day}
Phase: ${timelineItem.phase}
Topic: ${timelineItem.topic}
Today's Task: ${timelineItem.todayTask}
Challenges: ${timelineItem.challenges}

🎯 Goal:
Create a post that feels personal and thoughtful — like a "build in public" update. It should highlight effort, clarity, and curiosity rather than marketing tone.

🪄 Style & Formatting Rules:
- Start with a dynamic day header:
  💻 DAY ${timelineItem.day} — [short motivational or progress phrase]  
  Examples:  
  💻 DAY 5 — KEEPING THE STREAK ALIVE  
  ⚙️ DAY 3 — DEEP IN THE CODE GRIND  
  🚀 DAY 7 — CONSISTENCY OVER INTENSITY  
  🧠 DAY 10 — LEARNING BY BUILDING  

- Add a title line in CAPS related to today's topic:
  🔧 ${timelineItem.topic.toUpperCase()}  
  or  
  🛠️ ${timelineItem.todayTask.toUpperCase()}

- Use this structure:
  🧩 Focus — Describe what you worked on today and why it mattered.  
  🚧 Challenge — Explain the main technical struggle.  
  💡 Lesson — Share what you learned or improved.  

- Keep sentences short (1–2 lines max).  
  Use spacing for readability between ideas.

- Whenever you mention tech or tools (like NestJS, JWT, PostgreSQL, TypeORM, Redis, MongoDB, Docker, Microservices, etc.),  
  replace them with **LinkedIn-style hashtags** (example: #NestJS, #JWT, #Microservices).  
  Use 5–8 hashtags across the post — some inline, and 2–3 at the end.

- Avoid markdown (** or *), links, or emoji overload.  
  Use 3–5 emojis total for visual balance.

- End naturally — reflect on the day or progress, not with robotic lines like “Feeling accomplished.”  
  Then add a short, friendly question prefixed by 🤔 to invite discussion.

📘 Example Output:
---
💻 DAY 3 — PROGRESS IN THE CODE LAB  

🔧 USER AUTHENTICATION  

🧩 Focus —  
Today I worked on secure user authentication in our MainService using #NestJS Passport.  
I went with the #JWT strategy for its stateless nature — a great fit for our #Microservices architecture.  
I also added role-based access control to ensure users get only the permissions they need.  

🚧 Challenge —  
Integrating #JWT across multiple #Microservices was tricky.  
To handle it, I built a shared authentication module that centralizes token validation — reusable and easy to maintain.  

💡 Lesson —  
This reinforced how much modular design matters in distributed systems.  
By centralizing authentication, I simplified integration while improving both security and clarity.  

A few late-night debugging sessions later, seeing smooth logins across services felt totally worth it.  
🤔 How do you handle authentication in your #Microservices?  

#BackendDevelopment #BuildInPublic #SoftwareEngineering
---

Now, generate the full LinkedIn post following this tone, structure, and visual style — without markdown, links, or promotional tone.
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    let rawOutput = completion.choices?.[0]?.message?.content?.trim();
    if (!rawOutput) throw new Error("Empty response from AI model.");

    // Clean any accidental markdown or code fences
    rawOutput = rawOutput.replace(/^```(?:\w+)?/i, "").replace(/```$/, "").trim();

    return rawOutput;
  } catch (err) {
    console.error("❌ Error generating post:", err.message);
    if (err.response?.data) console.error(err.response.data);
    throw err;
  }
};
