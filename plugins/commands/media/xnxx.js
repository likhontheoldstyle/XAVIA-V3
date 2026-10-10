import axios from "axios";
import { writeFileSync, createReadStream, unlinkSync } from "fs";
import { join } from "path";

const API = "https://xnxx-api-eight.vercel.app";

const config = {
  name: "xnxx",
  aliases: [],
  version: "1.0.0",
  credits: "Rika",
  permissions: [0],
  cooldowns: 10,
  description: "Search and download XNXX videos",
  usage: "random | search <query> | <video url>",
  category: "media"
};

async function downloadAndSendVideo(message, videoUrl, msg) {
  const clean = () => { if (msg) msg.unsend().catch(() => {}); };
  try {
    const { data } = await axios.get(`${API}/video`, {
      params: { url: videoUrl },
      timeout: 60000
    });
    const dlUrl = data?.download_url;
    if (!dlUrl) throw new Error("No download URL from API.");

    const title = (data.title || "xnxx_video").replace(/[\\/:"*?<>|]/g, "").slice(0, 50);
    const save = join(global.cachePath, `${title}_${Date.now()}.mp4`);

    const res = await axios.get(dlUrl, { responseType: "arraybuffer", timeout: 180000 });
    const buf = Buffer.from(res.data);
    if (buf.length > 24 * 1024 * 1024) {
      clean();
      return message.reply("❌ Video too large (>24MB), Messenger-e pathano jabe na.");
    }
    writeFileSync(save, buf);

    await message.reply({
      body: `🎬 ${data.title}`,
      attachment: createReadStream(save)
    }).then(() => unlinkSync(save)).catch(() => unlinkSync(save));
    clean();
  } catch (e) {
    console.error("XNXX download error:", e.message);
    clean();
    message.reply("❌ Video download failed: " + (e.message || "unknown error"));
  }
}

async function handleReply({ message, eventData }) {
  const { results, messageID } = eventData;
  const v = parseInt(message.body);

  if (isNaN(v) || v < 1 || v > results.length) {
    return message.reply(`❌ Invalid choice. Reply with a number 1-${results.length}.`);
  }

  const picked = results[v - 1];
  const msg = await message.send("⏳ Downloading...");
  await global.api.unsendMessage(messageID).catch(() => {});
  await downloadAndSendVideo(message, picked.url, msg);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function showList(message, results) {
  const list = results.slice(0, 10);

  let text = "🔞 XNXX\n\n";
  list.forEach((r, i) => {
    text += `${i + 1}. ${r.title}\n   ⏱ ${r.duration || "?"} | 👁 ${r.views || "?"} | ⭐ ${r.rating || "?"}\n`;
  });

  message.reply(text + "\nReply with a number (1-10) to download.").then(d => {
    d.addReplyEvent({
      callback: handleReply,
      results: list,
      messageID: d.messageID,
      author: message.senderID,
      author_only: true
    });
  });
}

async function onCall({ message, args }) {
  const input = args.join(" ").trim();
  if (!input) return message.reply("❌ Usage: /xnxx random | /xnxx search <query> | /xnxx <video url>");

  const lower = input.toLowerCase();

  if (lower === "random") {
    const msg = await message.send("⏳ Fetching...");
    try {
      const { data } = await axios.get(`${API}/trending`, {
        params: { limit: 36 },
        timeout: 60000
      });
      const results = shuffle(data.results || []);
      if (!results.length) throw new Error("No results.");
      msg.unsend().catch(() => {});
      return showList(message, results);
    } catch (e) {
      msg.unsend().catch(() => {});
      return message.reply("❌ Failed to fetch videos.");
    }
  }

  if (/^https?:\/\//i.test(input)) {
    if (!/xnxx/i.test(input)) return message.reply("❌ Not an XNXX link.");
    const msg = await message.send("⏳ Downloading...");
    return downloadAndSendVideo(message, input.split(/\s+/)[0], msg);
  }

  const query = lower.startsWith("search ") ? input.slice(7).trim() : input;
  if (!query) return message.reply("❌ Provide a search query.");

  const msg = await message.send("⏳ Searching...");
  try {
    const { data } = await axios.get(`${API}/search`, {
      params: { q: query, limit: 10 },
      timeout: 60000
    });
    const results = data.results || [];
    if (!results.length) throw new Error("No results.");
    msg.unsend().catch(() => {});
    return showList(message, results);
  } catch (e) {
    msg.unsend().catch(() => {});
    return message.reply("❌ No results found.");
  }
}

export async function downloadXnxx(message, url) {
  const msg = await message.send("⏳ Downloading XNXX video...");
  await downloadAndSendVideo(message, url, msg);
}

export default { config, onCall };
