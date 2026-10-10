import axios from "axios";
import { execFile } from "child_process";
import { createWriteStream, existsSync, unlink } from "fs";
import { createRequire } from "module";
import { tmpdir } from "os";
import { join } from "path";

const require = createRequire(import.meta.url);

export function resolveFfmpeg() {
    try {
        const p = require("ffmpeg-static");
        if (typeof p === "string" && p.length > 0 && existsSync(p)) return p;
    } catch {}
    return "ffmpeg";
}

const FFMPEG_BIN = resolveFfmpeg();

const config = {
    name: "v2a",
    description: "Convert replied video to audio (MP3)",
    usage: "[reply to a video]",
    cooldown: 15,
    permissions: [0],
    credits: "Rika",
};

const langData = {
    en_US: {
        noVideo: "Please reply to a video message to convert it to audio.",
        notVideo: "The replied message is not a video.",
        done: "🎵 Here is your audio!",
        error: "An error occurred. Please try again later.",
    },
    vi_VN: {
        noVideo: "Vui lòng reply một tin nhắn video để chuyển thành audio.",
        notVideo: "Tin nhắn được reply không phải là video.",
        done: "🎵 Đây là audio của bạn!",
        error: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
    },
    ar_SY: {
        noVideo: "يرجى الرد على رسالة فيديو لتحويلها إلى صوت.",
        notVideo: "الرسالة المرد عليها ليست فيديو.",
        done: "🎵 هذا هو الملف الصوتي!",
        error: "حدث خطأ. حاول لاحقًا.",
    },
};

function downloadFile(url, dest) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios({
                url,
                method: "GET",
                responseType: "stream",
            });
            const writer = createWriteStream(dest);
            res.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", reject);
        } catch (e) {
            reject(e);
        }
    });
}

function convertToMp3(input, output) {
    return new Promise((resolve, reject) => {
        execFile(
            FFMPEG_BIN,
            ["-y", "-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", "128k", output],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

async function onCall({ message, getLang }) {
    const { reply, react, type, messageReply } = message;
    const att =
        type === "message_reply" ? messageReply?.attachments?.[0] : null;
    if (!att || !att.url) return reply(getLang("noVideo"));
    if (att.type && att.type !== "video") return reply(getLang("notVideo"));

    const base = join(tmpdir(), `v2a_${Date.now()}`);
    const inPath = base + ".mp4";
    const outPath = base + ".mp3";

    try {
        if (react) await react("⏳").catch(() => {});
        await downloadFile(att.url, inPath);
        await convertToMp3(inPath, outPath);
        const stream = await getStream(outPath);
        await reply({ attachment: stream });
        if (react) await react("✅").catch(() => {});
    } catch (e) {
        console.error(e);
        if (react) await react("❌").catch(() => {});
        reply(getLang("error"));
    } finally {
        unlink(inPath, () => {});
        unlink(outPath, () => {});
    }
}

export default {
    config,
    langData,
    onCall,
};
