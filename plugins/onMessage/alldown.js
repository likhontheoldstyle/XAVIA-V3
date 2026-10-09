import { downloadAndSend } from "../commands/media/alldown.js";

const fallbackLang = (key) =>
    ({
        downloading: "⏳ Downloading video...",
        fetchFail:
            "Failed to fetch video details. Please check the URL and try again.",
        downloadFail:
            "An error occurred while downloading the video. Please try again.",
    }[key] || key);

async function onCall({ message, data }) {
    const { senderID, body } = message;
    if (!body || senderID == global.botID) return;
    const text = body.trim();
    if (!/^https?:\/\//i.test(text)) return;
    const prefix = data?.thread?.data?.prefix || global.config?.PREFIX || "/";
    if (text.startsWith(prefix)) return;
    const url = text.split(/\s+/)[0];
    await downloadAndSend(message, url, fallbackLang);
}

export default {
    onCall,
};
