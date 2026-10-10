import axios from "axios";

const VISION_API = "https://gemini-api-rose-zeta.vercel.app/api/vision";

const config = {
  name: "prompt",
  aliases: ["p"],
  version: "0.0.7",
  credits: "Rika",
  permissions: [0],
  description: "Analyze image with AI (scraped Gemini)",
  usage: "reply to an image with prompt",
  category: "nix"
};

async function onCall({ message, args }) {
  const prompt = args.join(" ") || "Describe this image";
  const isReplyPhoto = message.type === "message_reply" && message.messageReply?.attachments?.[0]?.type === "photo";

  if (!isReplyPhoto) {
    return message.reply("❌ Please reply to an image.\nExample: reply to a photo with: prompt what is this?");
  }

  message.react("⏳");

  try {
    const att = message.messageReply.attachments[0];
    const urls = [att.url, att.previewUrl].filter(Boolean);
    if (!urls.length) throw new Error("No image URL in attachment");

    const cookieHeader = (() => {
      try {
        const state = global.api?.getAppState?.() || [];
        return state.map(c => `${c.key}=${c.value}`).join("; ");
      } catch { return ""; }
    })();

    let img = null, dlErr = null;
    for (const u of urls) {
      try {
        img = await axios.get(u, {
          responseType: "arraybuffer",
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
            "Referer": "https://www.facebook.com/",
            ...(cookieHeader ? { "Cookie": cookieHeader } : {})
          },
          maxContentLength: 20 * 1024 * 1024,
          timeout: 30000
        });
        break;
      } catch (e) { dlErr = e; }
    }
    if (!img) throw new Error("Image download failed: " + (dlErr?.message || dlErr));

    const mime = img.headers["content-type"]?.split(";")[0] || "image/jpeg";
    const b64 = Buffer.from(img.data).toString("base64");

    const { data } = await axios.post(VISION_API, {
      image: `data:${mime};base64,${b64}`,
      prompt
    }, { headers: { "Content-Type": "application/json" }, timeout: 120000 });

    if (!data?.success) throw new Error(data?.error || "Vision API failed");
    if (!data.response) throw new Error("Empty response");

    message.react("✅");
    return message.reply(`🤖 ${data.response}`);
  } catch (e) {
    console.error("Prompt API Error:", e.message || e);
    message.react("❌");
    return message.reply("⚠ AI theke reply asche na.");
  }
}

export default { config, onCall };
