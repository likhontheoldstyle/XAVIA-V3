import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";

const config = {
  name: "shazam",
  aliases: ["findsong", "whatsong"],
  version: "1.1.0",
  credits: "Rika",
  permissions: [0],
  cooldowns: 10,
  description: "Identify song from replied audio/video",
  usage: "reply to audio/video with /shazam",
  category: "rika"
};

let shazamReady = false;
async function ensureShazam() {
  if (shazamReady) return;
  const core = await import("shazamio-core");
  await core.start();
  shazamReady = true;
}

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

async function extractWav(buffer) {
  let ffmpegPath;
  try {
    ffmpegPath = (await import("ffmpeg-static")).default;
  } catch {
    ffmpegPath = "ffmpeg";
  }
  const tmpOut = path.join(os.tmpdir(), `shazam-${crypto.randomBytes(8).toString("hex")}.wav`);
  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, [
      "-y", "-t", "12", "-i", "pipe:0",
      "-ac", "1", "-ar", "44100", "-f", "wav", tmpOut
    ]);
    proc.stdin.write(buffer);
    proc.stdin.end();
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg failed"))));
    proc.on("error", reject);
  });
  const data = fs.readFileSync(tmpOut);
  fs.unlinkSync(tmpOut);
  return data;
}

async function identifySong(wavBuffer) {
  await ensureShazam();
  const core = await import("shazamio-core");
  const signatures = core.recognizeBytes(new Uint8Array(wavBuffer));
  if (!signatures.length) return null;

  const sig = signatures[0];
  const uri = sig.uri;
  sig.free();

  const uuid1 = crypto.randomUUID();
  const uuid2 = crypto.randomUUID();
  const res = await axios.post(
    `https://amp.shazam.com/discovery/v5/en/US/iphone/-/tag/${uuid1}/${uuid2}`,
    {
      geolocation: { altitude: 0, latitude: 0, longitude: 0 },
      signature: { samplems: 12000, timestamp: Date.now(), uri },
      timestamp: Date.now(),
      timezone: "Asia/Dhaka"
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Shazam/15.18.0"
      },
      timeout: 15000
    }
  );

  const track = res.data?.track;
  if (!track) return null;
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
    const wav = await extractWav(buffer);
    const song = await identifySong(wav);

    if (song) {
      return message.reply(`🎵 *${song.title}*\n👤 ${song.artist}\n💿 ${song.album}`);
    }
    return message.reply("❌ Song not found");
  } catch (e) {
    return message.reply(`❌ Error: ${e.message}`);
  }
}

export { config, onCall };
