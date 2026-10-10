import { downloadXnxx } from "../commands/media/xnxx.js";

async function onCall({ message, data }) {
    const { senderID, body } = message;
    if (!body || senderID == global.botID) return;
    const text = body.trim();
    if (!/^https?:\/\//i.test(text)) return;
    const prefix = data?.thread?.data?.prefix || global.config?.PREFIX || "/";
    if (text.startsWith(prefix)) return;
    const url = text.split(/\s+/)[0];
    if (!/xnxx\.(com|videos\.me)/i.test(url)) return;
    await downloadXnxx(message, url);
}

export default {
    onCall,
};
