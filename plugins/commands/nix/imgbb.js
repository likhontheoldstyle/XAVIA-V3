import axios from "axios";

const IMGBB_API = "https://rika-imgbb-api.vercel.app/upload";

const config = {
  name: "imgbb",
  aliases: ["imgup"],
  version: "1.0.0",
  credits: "Rika",
  permissions: [0],
  cooldowns: 5,
  description: "Upload image to ImgBB and get link",
  usage: "reply to an image or /imgbb <image url>",
  category: "utility"
};

async function onCall({ message, args }) {
  const urlArg = args[0];
  const isReplyPhoto = message.type === "message_reply" && message.messageReply?.attachments?.[0]?.type === "photo";

  if (!isReplyPhoto && !urlArg) {
    return message.reply("❌ Reply to an image or provide an image URL.\nExample: imgbb https://example.com/pic.jpg");
  }

  message.react("⏳");

  try {
    let data;

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

      ({ data } = await axios.post(IMGBB_API, {
        image: `data:${mime};base64,${b64}`
      }, { headers: { "Content-Type": "application/json" }, timeout: 60000 }));
    } else {
      ({ data } = await axios.get(IMGBB_API, {
        params: { url: urlArg },
        timeout: 60000
      }));
    }

    if (!data?.success) throw new Error(data?.error || "Upload failed");

    message.react("✅");
    return message.reply(
      `✅ Uploaded to ImgBB!\n\n🔗 Link: ${data.data.display_url}\n🖼 Viewer: ${data.data.url_viewer}\n📐 ${data.data.width}x${data.data.height}`
    );
  } catch (e) {
    console.error("ImgBB Error:", e.message || e);
    message.react("❌");
    return message.reply("⚠ Image upload kora jacchhe na.");
  }
}

export default { config, onCall };
