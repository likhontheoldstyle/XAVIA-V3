import axios from "axios";

const API = "https://himu-voice-api.vercel.app";

const config = {
  name: "voice",
  aliases: ["v"],
  version: "1.0.0",
  credits: "Rika",
  permissions: [0],
  cooldowns: 5,
  description: "Play voice from Himu Voice API",
  usage: "[voice name] or empty for list",
  category: "rika"
};

async function onCall({ message, args }) {
  const sub = args[0]?.toLowerCase();

  if (sub === "upload") {
    const name = args[1]?.toLowerCase();
    if (!name) return message.reply("❌ Usage: reply to audio with /voice upload {name}");

    const replied = message.messageReply;
    const audio = replied?.attachments?.find(a => a.type === "audio");
    if (!audio) return message.reply("❌ Audio-te reply diye command daw.");

    try {
      message.react("⏳");
      const r = await axios.get(audio.url, { responseType: "arraybuffer", timeout: 60000 });
      const b64 = Buffer.from(r.data).toString("base64");

      const { data } = await axios.post(`${API}/upload`, { name, audio: b64 }, { timeout: 60000 });
      message.react("✅");
      return message.reply(
        `╭────────────❍\n╰➤ 🎙『 𝐕𝐎𝐈𝐂𝐄 𝐔𝐏𝐋𝐎𝐀𝐃𝐄𝐃 』\n\n╰➤ 📁 ${data.name || name}.mp3\n╰➤ 🗣 /voice ${data.name || name}\n╰─────────────────➤`
      );
    } catch (e) {
      console.error("Voice Upload Error:", e.message || e);
      message.react("❌");
      return message.reply("⚠ Upload failed. Audio 10MB-er niche hote hobe.");
    }
  }

  const name = sub;

  try {
    if (!name) {
      const { data } = await axios.get(`${API}/list`, { timeout: 30000 });
      const voices = (data.voices || []).map(v => v.replace(/\.(mp3|wav)$/i, ""));
      if (!voices.length) return message.reply("❌ No voices found.");
      message.react("✅");
      return message.reply(
        `╭────────────❍\n╰➤ 🎙『 𝐕𝐎𝐈𝐂𝐄 𝐋𝐈𝐒𝐓 』\n\n╰➤ ${voices.join(", ")}\n\n╰➤ 🗣 /voice [name]\n╰─────────────────➤`
      );
    }

    message.react("⏳");
    const { data } = await axios.get(`${API}/list`, { timeout: 30000 });
    const voices = data.voices || [];
    const match = voices.find(v => v.toLowerCase().startsWith(name));

    if (!match) {
      message.react("❌");
      return message.reply(`❌ Voice "${name}" not found.\nUse /voice to see list.`);
    }

    const r = await axios.get(`${API}/voice/${match.replace(/\.(mp3|wav)$/i, "")}`, {
      responseType: "stream",
      timeout: 60000
    });

    message.react("✅");
    return message.reply({
      attachment: r.data
    });
  } catch (e) {
    console.error("Voice API Error:", e.message || e);
    message.react("❌");
    return message.reply("⚠ Voice play kora jacchhe na.");
  }
}

export default { config, onCall };
