import axios from "axios";

const config = {
  name: "flux",
  aliases: [],
  version: "0.0.2",
  credits: "Rika",
  permissions: [0],
  cooldowns: 5,
  description: "Generate image using AI",
  usage: "[prompt text]",
  category: "ai"
};

async function onCall({ message, args }) {
  const p = args.join(" ");
  if (!p) {
    return message.reply("❌ Please provide a prompt.\nExample: flux cyberpunk city");
  }

  message.react("⏳");

  const u = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true`;

  try {
    const r = await axios.get(u, { responseType: 'stream', timeout: 120000 });

    await message.reply({
      body: `✅ Here is your AI image!\n\n📝 Prompt: ${p}`,
      attachment: r.data
    });

    message.react("✅");
  } catch (e) {
    console.error("Flux API Error:", e.message || e);
    message.react("❌");
    message.reply("⚠ Image generate kora jacchhe na.");
  }
}

export default {
  config,
  onCall
};
