import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";

const config = {
  name: "shazam",
  aliases: ["findsong", "whatsong"],
  version: "1.0.0",
  credits: "Rika",
  permissions: [0],
  cooldowns: 10,
  description: "Identify song from replied audio/video",
  usage: "reply to audio/video with /shazam",
  category: "rika"
};

async function downloadBuffer(url, cookies = "") {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://www.facebook.com/",
      ...(cookies ? { Cookie: cookies } : {})
    },
    timeout: 30000
  });
  return Buffer.from(res.data);
}

async function extractSample(buffer, positionSec = 0, durationSec = 8) {
  let ffmpegPath;
  try {
    ffmpegPath = (await import("ffmpeg-static")).default;
  } catch {
    ffmpegPath = "ffmpeg";
  }
  const tmpOut = path.join(os.tmpdir(), `shazam-${crypto.randomBytes(8).toString("hex")}.raw`);
  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, [
      "-y", "-ss", String(positionSec), "-t", String(durationSec),
      "-i", "pipe:0", "-ac", "1", "-ar", "44100", "-f", "s16le", tmpOut
    ]);
    proc.stdin.write(buffer);
    proc.stdin.end();
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg failed"))));
    proc.on("error", reject);
  });
  const raw = fs.readFileSync(tmpOut);
  fs.unlinkSync(tmpOut);
  return raw;
}

async function recognizeShazam(sample) {
  const { Shazam } = await import("shazamio-core");
  const shazam = new Shazam();
  return shazam.recognize(sample);
}

function formatTrack(data) {
  const track = data?.track || {};
  return {
    title: track.title || "",
    artist: track.subtitle || "",
    album: track.sections?.[0]?.metadata?.find((m) => m.title === "Album")?.text || "",
    cover: track.images?.coverart || ""
  };
}

async function onCall({ message }) {
  const isReplyMedia =
    message.type === "message_reply" &&
    ["audio", "video"].includes(message.messageReply?.attachments?.[0]?.type);

  if (!isReplyMedia) {
    return message.reply("❌ Reply to an audio/video message with /shazam");
  }

  message.react("🎵");

  try {
    const att = message.messageReply.attachments[0];
    const url = att.url || att.previewUrl;
    if (!url) throw new Error("No media URL found");

    let cookies = "";
    try {
      const state = global.api?.getAppState?.() || [];
      cookies = state.map((c) => `${c.key}=${c.value}`).join("; ");
    } catch {}

    const buffer = await downloadBuffer(url, cookies);
    const sample = await extractSample(buffer);
    const result = await recognizeShazam(sample);

    if (result?.track) {
      const t = formatTrack(result);
      return message.reply(`🎵 *${t.title}*\n👤 ${t.artist}\n💿 ${t.album}`);
    }
    return message.reply("❌ Song not found");
  } catch (e) {
    return message.reply(`❌ Error: ${e.message}`);
  }
}

export { config, onCall };
