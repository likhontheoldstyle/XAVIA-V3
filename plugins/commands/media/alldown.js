import axios from "axios";

const config = {
    name: "alldown",
    aliases: ["vd"],
    description: "Download video from a given URL and send the video file",
    usage: "<URL>",
    cooldown: 10,
    permissions: [0],
    credits: "Mohammad Nayan",
};

const langData = {
    en_US: {
        missingUrl: "Please provide a valid URL. Usage: /alldown <URL>",
        fetchFail:
            "Failed to fetch video details. Please check the URL and try again.",
        downloadFail:
            "An error occurred while downloading the video. Please try again.",
    },
    vi_VN: {
        missingUrl: "Vui lòng cung cấp URL hợp lệ. Cách dùng: /alldown <URL>",
        fetchFail:
            "Không lấy được thông tin video. Vui lòng kiểm tra URL và thử lại.",
        downloadFail: "Đã xảy ra lỗi khi tải video. Vui lòng thử lại.",
    },
    ar_SY: {
        missingUrl: "يرجى تقديم رابط صالح. الاستخدام: /alldown <URL>",
        fetchFail: "فشل في جلب تفاصيل الفيديو. تحقق من الرابط وحاول مجددًا.",
        downloadFail: "حدث خطأ أثناء تنزيل الفيديو. حاول مجددًا.",
    },
};

async function onCall({ message, args, getLang }) {
    const { reply } = message;
    const url = args[0];
    if (!url || !url.startsWith("http"))
        return reply(getLang("missingUrl"));
    await downloadAndSend(message, url, getLang);
}

export async function downloadAndSend(message, url, getLang) {
    const { reply, react } = message;
    try {
        const { data } = await axios.get(
            `https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`
        );
        if (!data?.data?.low) {
            if (react) await react("❌").catch(() => {});
            return reply(getLang("fetchFail"));
        }
        const { title, low } = data.data;
        if (react) await react("⏳").catch(() => {});
        const stream = await getStream(low);
        await reply({
            body: `╭────────────❍\n╰➤『 🎬 𝐕𝐈𝐃𝐄𝐎 𝐃𝐄𝐓𝐀𝐈𝐋𝐒  』\n╰➤ 🎥 𝐓𝐈𝐓𝐋𝐄 : ${title || "Video"}\n╰─────────────────➤`,
            attachment: stream,
        });
        if (react) await react("✅").catch(() => {});
    } catch (e) {
        console.error(e);
        if (react) await react("❌").catch(() => {});
        reply(getLang("downloadFail"));
    }
}

export default {
    config,
    langData,
    onCall,
};
