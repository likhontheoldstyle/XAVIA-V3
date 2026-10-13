import axios from "axios";
import { writeFileSync, createReadStream, unlinkSync } from "fs";
import { join } from "path";

const API = "https://pinterest-api-orpin.vercel.app";

const config = {
  name: "pinterest",
  aliases: ["p", "pin"],
  version: "1.0.0",
  credits: "Rika",
  permissions: [0],
  cooldowns: 10,
  description: "Search and download Pinterest pins",
  usage: "<query> | pin <id/url>",
  category: "media"
};

async function sendPinImage(message, pin, msg) {
  const clean = () => { if (msg) (msg.unsend()?.catch(() => {})); };
  try {
    const imgUrl = pin.image;
    if (!imgUrl) throw new Error("No image found.");
    const res = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 60000 });
    const buf = Buffer.from(res.data);
    if (buf.length > 24 * 1024 * 1024) {
      clean();
      return message.reply("❌ Image too large (>24MB).");
    }
    const save = join(global.cachePath, `pinterest_${Date.now()}.jpg`);
    writeFileSync(save, buf);
    clean();
    await message.reply({
      body: `📌 ${pin.title || "Pinterest pin"}\n🔗 ${pin.pin_url || ""}`,
      attachment: createReadStream(save)
    }).then(() => unlinkSync(save)).catch(() => unlinkSync(save));
  } catch (e) {
    console.error("Pinterest send error:", e.message);
    clean();
    message.reply("❌ Failed to send image.");
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
  await global.api.unsendMessage(messageID)?.catch(() => {});
  await sendPinImage(message, picked, msg);
}

async function showList(message, results, page = 1) {
  const list = results.slice(0, 10);
  const attachments = [];
  const saved = [];
  for (const pin of list) {
    try {
      if (!pin.image) continue;
      const res = await axios.get(pin.image, { responseType: "arraybuffer", timeout: 60000 });
      const buf = Buffer.from(res.data);
      if (buf.length > 24 * 1024 * 1024) continue;
      const save = join(global.cachePath, `pinterest_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
      writeFileSync(save, buf);
      saved.push(save);
      attachments.push(createReadStream(save));
    } catch (e) {
      console.error("Pinterest image download error:", e.message);
    }
  }
  if (!attachments.length) return message.reply("❌ Failed to download images.");
  await message.reply({
    body: `📌 Pinterest - Page ${page} (${attachments.length} images)`,
    attachment: attachments
  }).catch(() => {});
  saved.forEach(f => { try { unlinkSync(f); } catch (e) {} });
}

async function onCall({ message, args }) {
  const input = args.join(" ").trim();
  if (!input) return message.reply("❌ Usage: /pinterest <query> | /pin <id/url>");

  const cmd = message.commandName || "pinterest";

  if (cmd === "pin" || /^https?:\/\//i.test(input) || /^\d{10,20}$/.test(input.split(/\s+/)[0])) {
    const msg = await message.send("⏳ Fetching pin...");
    try {
      const first = input.split(/\s+/)[0];
      const params = /^\d{10,20}$/.test(first) ? { id: first } : { url: first };
      const { data } = await axios.get(`${API}/pin`, { params, timeout: 60000 });
      if (!data.success) throw new Error("Pin not found.");
      (msg.unsend()?.catch(() => {}));
      return sendPinImage(message, data, null);
    } catch (e) {
      (msg.unsend()?.catch(() => {}));
      return message.reply("❌ Pin not found.");
    }
  }

  const parts = input.split(/\s+/);
  let page = 1;
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
    page = parseInt(parts.pop());
  }
  const query = parts.join(" ");

  const msg = await message.send("⏳ Searching...");
  try {
    const { data } = await axios.get(`${API}/search`, {
      params: { q: query, limit: 50 },
      timeout: 60000
    });
    const results = data.pins || [];
    const start = (page - 1) * 10;
    const pageResults = results.slice(start, start + 10);
    if (!pageResults.length) throw new Error("No results.");
    (msg.unsend()?.catch(() => {}));
    return showList(message, pageResults, page);
  } catch (e) {
    (msg.unsend()?.catch(() => {}));
    return message.reply("❌ No results found.");
  }
}

export default { config, onCall };
