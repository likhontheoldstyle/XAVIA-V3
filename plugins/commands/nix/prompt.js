import axios from "axios";

const API = "https://gemini-api-rose-zeta.vercel.app/api/ask";

const config = {
  name: "prompt",
  aliases: ["p"],
  version: "0.0.5",
  credits: "Rika",
  permissions: [0],
  description: "Ask AI (scraped Gemini)",
  usage: "[your question]",
  category: "ai"
};

async function onCall({ message, args }) {
  const prompt = args.join(" ");
  if (!prompt) {
    return message.reply("❌ Please provide a prompt.\nExample: prompt what is AI?");
  }

  message.react("⏳");

  try {
    const { data } = await axios.get(API, {
      params: { prompt },
      timeout: 90000
    });

    if (!data?.success) throw new Error(data?.error || "API failed");

    const reply = data.response || data.reply;
    if (!reply) throw new Error("Empty response");

    message.react("✅");
    return message.reply(`🤖 ${reply}`);
  } catch (e) {
    console.error("Prompt API Error:", e.message || e);
    message.react("❌");
    return message.reply("⚠ AI theke reply asche na.");
  }
}

export default { config, onCall };
