import { Post } from "../models/post.js";
import { generatePost } from "../services/aiService.js";
import { createLinkedInDraft } from "../services/linkedinService.js";

export async function runDailyPoster() {
  try {
    const today = new Date().getDate();
   // Get the next pending day post (lowest day not completed)
const post = await Post.findOne({ status: "pending" }).sort({ day: 1 });


    if (!post) {
      console.log("⚠️ No post data found for today.");
      return;
    }

    console.log(`🗓️ Generating LinkedIn post for Day ${today}: ${post.phase}`);

    const aiContent = await generatePost(post);
    await createLinkedInDraft(aiContent);

    post.status = "posted";
    await post.save();

    console.log(`✅ Post for Day ${today} marked as posted.`);
  } catch (err) {
    console.error("❌ Daily Poster Error:", err.message);
  }
}
