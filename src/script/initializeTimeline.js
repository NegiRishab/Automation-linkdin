
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import { Post } from "../models/post.js";
import { generateTimeline } from "../services/aiService.js";

const main = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

   // 2️⃣ Define your project description (keep it clean JSON or JS object)
    const projectDescription = {
      project: {
        name: "Devsync - Team Collaboration & Project Management Platform",
        overview:
          "Devsync is a full-stack microservices-based collaboration platform that helps teams manage projects, streamline communication, and automate workflows. It is divided into two main services — MainService and ChatService — for modularity and scalability.",
        objectives: [
          "Enable teams to manage organizations, workplaces, and tasks efficiently.",
          "Provide real-time communication and notifications.",
          "Offer modular architecture for scalability and fault tolerance."
        ],
        architecture: {
          pattern: "Microservices Architecture",
          services: {
            MainService: {
              description:
                "Built with NestJS, handles core functionalities like organization management, user management, and task workflows."
            },
            ChatService: {
              description:
                "Built with Node.js, manages real-time chatrooms, private messages, and communication between team members."
            }
          },
          communication: "Redis Pub/Sub and Socket.IO for real-time event broadcasting",
          data_management: {
            databases: {
              PostgreSQL:
                "Used for relational business data (users, organizations, tasks)",
              MongoDB: "Used for unstructured data (chat messages, logs)"
            }
          },
          frontend: {
            framework: "React",
            styling: "Tailwind CSS",
            language: "TypeScript"
          }
        },
        tech_stack: [
          "NestJS",
          "Node.js",
          "React",
          "Tailwind CSS",
          "TypeScript",
          "PostgreSQL",
          "MongoDB",
          "Redis",
          "Socket.IO",
          "Microservices",
          "Real-time Notifications"
        ],
        key_features: [
          "Create and manage organizations and workplaces",
          "Invite users and assign them dynamically based on project needs",
          "Real-time chatrooms (global and private) powered by ChatService",
          "Real-time notifications for new cards and status updates",
          "Profile and organization management",
          "Secure authentication and role-based access control"
        ],
        devops: {
          deployment: {
            backend: "Render Platform",
            frontend: "Vercel"
          },
          ci_cd: {
            tool: "GitHub Actions",
            automation: [
              "Build and test on each commit",
              "Run migrations via GitHub Actions before Render deployment (Render free tier limitation fix)",
              "Trigger deployment automatically after CI success"
            ]
          },
          containerization: "Docker used for local testing and service isolation"
        },
        challenges: [
          {
            title: "Architectural Complexity",
            details:
              "Defining clear boundaries between MainService and ChatService while maintaining communication integrity.",
            solution:
              "Established DTO-based service contracts and Redis-based event queues."
          },
          {
            title: "Application Flow & Real-Time Synchronization",
            details:
              "Coordinating WebSocket events and API calls across microservices.",
            solution:
              "Used event-driven design with Socket.IO namespaces and Redis Pub/Sub."
          },
          {
            title: "Debugging Across Microservices",
            details: "Tracing issues was difficult due to distributed architecture.",
            solution:
              "Implemented structured logging, correlation IDs, and Docker-based local environments."
          },
          {
            title: "Deployment Limitation on Render Free Tier",
            details:
              "Render free plan didn’t allow direct migration execution.",
            solution:
              "Created a custom GitHub Actions workflow to run migrations before Render deployment."
          },
          {
            title: "Hybrid Data Management",
            details:
              "Maintaining data consistency between PostgreSQL and MongoDB.",
            solution:
              "Separated data ownership clearly — Postgres for structured data, MongoDB for unstructured chat logs."
          }
        ],
        learnings: [
          "Deep understanding of microservices communication and service boundaries.",
          "Real-time system design using Socket.IO and Redis Pub/Sub.",
          "Efficient DevOps workflows using GitHub Actions and CI/CD pipelines.",
          "Overcoming platform limitations using automation.",
          "Designing hybrid database architecture (PostgreSQL + MongoDB)."
        ],
        outcome:
          "Successfully built and deployed a scalable, production-grade collaboration platform with modular microservices, real-time chat, notifications, and CI/CD automation."
      }
    };

    console.log("🧠 Generating 30-day detailed timeline...");
    const timeline = await generateTimeline(projectDescription);

    if (!timeline || timeline.length === 0) {
      console.error("⚠️ No timeline generated. Check AI service.");
      process.exit(1);
    }

    console.log(`✅ Generated ${timeline.length} days. Saving to DB...`);
    await Post.insertMany(timeline);

    console.log("🎉 Timeline successfully saved to MongoDB!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating timeline:", error);
    process.exit(1);
  }
};

main();

