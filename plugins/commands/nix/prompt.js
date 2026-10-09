import axios from "axios";

const ASK_API = "https://gemini-api-rose-zeta.vercel.app/api/ask";
const VISION_API = "https://gemini-api-rose-zeta.vercel.app/api/vision";

const config = {
  name: "prompt",
  aliases: ["p"],
  version: "0.0.4",
  credits: "Rika",
  permissions: [0],
  description: "Ask AI with optional image (scraped Gemini)",
  usage: "reply to an image with prompt, or just text",
  category: "ai"
};

async function onCall({ message, args }) {
  const prompt = args.join(" ") || "Describe this image";
  const isReplyPhoto = message.type === "message_reply" && message.messageReply?.attachments?.[0]?.type === "photo";

  if (!isReplyPhoto && !args.length) {
    return message.reply("❌ Reply to an image with a prompt, or just type a question.\nExample: prompt what is AI?");
  }

  message.react("⏳");

  try {
    let reply;

    if (isReplyPhoto) {
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
      reply = data.response;
    } else {
      const { data } = await axios.get(ASK_API, {
        params: { prompt },
        timeout: 90000
      });
      if (!data?.success) throw new Error(data?.error || "API failed");
      reply = data.response || data.reply;
    }

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
