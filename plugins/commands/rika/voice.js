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
  const name = args[0]?.toLowerCase();

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
      body: `🎙 ${match}`,
      attachment: r.data
    });
  } catch (e) {
    console.error("Voice API Error:", e.message || e);
    message.react("❌");
    return message.reply("⚠ Voice play kora jacchhe na.");
  }
}

export default { config, onCall };
