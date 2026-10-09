import axios from "axios";

const GEMINI_KEY = "AQ.Ab8RN6KVRSqDx1tqiUTCgBN4vPEpmFn3i2F6KSKAEBXMux4NIg";
const API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const config = {
  name: "prompt",
  aliases: ["p"],
  version: "0.0.2",
  credits: "Rika",
  permissions: [0],
  description: "Image analysis with AI prompt (Gemini)",
  usage: "reply to an image with optional prompt",
  category: "ai"
};

async function onCall({ message, args }) {
  const prompt = args.join(" ") || "Describe this image";

  if (message.type === "message_reply" && message.messageReply?.attachments?.[0]?.type === "photo") {
    try {
      message.react("⏳");
      const imageUrl = message.messageReply.attachments[0].url;
      if (!imageUrl) throw new Error("No image URL in attachment");
      let img;
      try {
        img = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36" },
          maxContentLength: 20 * 1024 * 1024,
          timeout: 30000
        });
      } catch (dlErr) {
        throw new Error("Image download failed: " + (dlErr.message || dlErr));
      }
      const mime = img.headers["content-type"]?.split(";")[0] || "image/jpeg";
      const b64 = Buffer.from(img.data).toString("base64");

      let data;
      try {
        ({ data } = await axios.post(
          `${API}?key=${GEMINI_KEY}`,
          { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }] },
          { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        ));
      } catch (apiErr) {
        const apiMsg = apiErr.response?.data?.error?.message || apiErr.message;
        throw new Error("Gemini API failed: " + apiMsg);
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error("No response from Gemini API.");

      message.reply(reply);
      return message.react("✅");
    } catch (e) {
      console.error("Gemini vision error:", e.message || e);
      message.reply("❌ " + (e.message || "An error occurred while analyzing the image."));
      return message.react("❌");
    }
  }

  message.reply("⚠️ Please reply with an image.");
}

export default {
  config,
  onCall
};
