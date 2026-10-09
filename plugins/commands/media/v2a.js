import axios from "axios";
import { execFile } from "child_process";
import { createWriteStream, unlink } from "fs";
import { tmpdir } from "os";
import { join } from "path";

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
        downloading: "⏳ Downloading video...",
        converting: "⏳ Converting to audio...",
        done: "🎵 Here is your audio!",
        error: "An error occurred. Please try again later.",
    },
    vi_VN: {
        noVideo: "Vui lòng reply một tin nhắn video để chuyển thành audio.",
        notVideo: "Tin nhắn được reply không phải là video.",
        downloading: "⏳ Đang tải video...",
        converting: "⏳ Đang chuyển thành audio...",
        done: "🎵 Đây là audio của bạn!",
        error: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
    },
    ar_SY: {
        noVideo: "يرجى الرد على رسالة فيديو لتحويلها إلى صوت.",
        notVideo: "الرسالة المرد عليها ليست فيديو.",
        downloading: "⏳ جارٍ تنزيل الفيديو...",
        converting: "⏳ جارٍ التحويل إلى صوت...",
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
            "ffmpeg",
            ["-y", "-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", "128k", output],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

async function onCall({ message, getLang }) {
    const { reply, type, messageReply } = message;
    const att =
        type === "message_reply" ? messageReply?.attachments?.[0] : null;
    if (!att || !att.url) return reply(getLang("noVideo"));
    if (att.type && att.type !== "video") return reply(getLang("notVideo"));

    const base = join(tmpdir(), `v2a_${Date.now()}`);
    const inPath = base + ".mp4";
    const outPath = base + ".mp3";

    try {
        await reply(getLang("downloading"));
        await downloadFile(att.url, inPath);
        await reply(getLang("converting"));
        await convertToMp3(inPath, outPath);
        const stream = await getStream(outPath);
        await reply({ body: getLang("done"), attachment: stream });
    } catch (e) {
        console.error(e);
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
