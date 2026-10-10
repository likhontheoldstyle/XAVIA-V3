import axios from "axios";

const API = "https://drive-api-rahad.vercel.app/upload";

const config = {
  name: "drive",
  version: "0.0.2",
  credits: "Rika",
  permissions: [0],
  cooldowns: 10,
  description: "Upload file to Google Drive",
  usage: "<link> or reply to media",
  category: "tools"
};

async function onCall({ message, args }) {
  const i = message.type === "message_reply" && message.messageReply?.attachments?.[0]?.url || args[0];

  if (!i) return message.reply("⚠️ Please provide a valid URL or reply to a media message.");

  message.react("⏳");

  try {
    const r = await axios.get(API, {
      params: { url: i },
      timeout: 180000
    });
    const d = r.data || {};

    if (d.status === "success" && d.file) {
      message.react("✅");
      return message.reply(
        `╭────────────❍\n╰➤ ☁️『 𝐃𝐑𝐈𝐕𝐄 𝐔𝐏𝐋𝐎𝐀𝐃𝐄𝐃 』\n\n╰➤ 📁 ${d.file.name}\n╰➤ 📦 ${d.file.size}\n\n╰➤ 👁 Preview: ${d.file.preview_url}\n╰➤ 🔗 Download: ${d.file.download_url}\n╰─────────────────➤`
      );
    }

    message.react("❌");
    return message.reply(`❌ Upload failed: ${d.message || "unknown error"}`);
  } catch (e) {
    console.error("Drive upload error:", e.message || e);
    message.react("❌");
    return message.reply("❌ An error occurred during upload. Please try again later.");
  }
}

export default {
  config,
  onCall
};
