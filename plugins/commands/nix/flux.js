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
  category: "nix"
};

async function onCall({ message, args }) {
  const p = args.join(" ");
  if (!p) {
    return message.reply("❌ Please provide a prompt.\nExample: flux cyberpunk city");
  }

  message.react("⏳");

  const u = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true`;

  let r = null, lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      r = await axios.get(u, { responseType: 'stream', timeout: 120000 });
      const ct = r.headers['content-type'] || '';
      if (!ct.startsWith('image/')) throw new Error('API returned ' + ct);
      break;
    } catch (e) {
      lastErr = e;
      r = null;
      if (attempt < 2) await new Promise(res => setTimeout(res, (attempt + 1) * 8000));
    }
  }

  try {
    if (!r) throw lastErr || new Error('No response');

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
