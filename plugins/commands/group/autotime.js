const moment = require("moment-timezone");

const config = {
    name: "autotime",
    description: "Send hourly time notification to group",
    usage: "on | off",
    cooldown: 3,
    permissions: [1, 2],
    credits: "Rika"
};

const langData = {
    "en_US": {
        "enabled": "✅ Hourly time notification enabled.",
        "disabled": "❌ Hourly time notification disabled.",
        "usage": "Usage:\n/autotime on\n/autotime off"
    }
};

const BOLD_DIGITS = {
    "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒",
    "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗"
};

function toBoldDigits(str) {
    return String(str).split("").map(c => BOLD_DIGITS[c] || c).join("");
}

function getTimeText() {
    const now = moment().tz("Asia/Dhaka");
    const h12 = now.format("hh");
    const mm = now.format("mm");
    const ampm = now.format("A") === "AM" ? "𝐀𝐌" : "𝐏𝐌";
    return `${toBoldDigits(h12)}:${toBoldDigits(mm)} ${ampm}`;
}

function buildMsg() {
    return `╭────────────❍\n╰➤ 🕒『 𝐍𝐎𝐖 𝐓𝐈𝐌𝐄 』,\n╰➤ 🔰 : ${getTimeText()}\n╰─────────────────➤`;
}

async function isEnabled(threadID) {
    const data = await global.controllers.Threads.getData(threadID);
    const s = data?.autotime;
    if (!s) return true;
    return s.enabled !== false;
}

async function setEnabled(threadID, enabled) {
    await global.controllers.Threads.updateData(threadID, {
        autotime: { enabled }
    });
}

async function checkAndSend() {
    try {
        const now = moment().tz("Asia/Dhaka");
        if (now.minute() !== 0) return;
        const hourKey = now.format("YYYY-MM-DD-HH");
        const allThreads = await global.controllers.Threads.getAll?.() || [];
        for (const t of allThreads) {
            const threadID = t.threadID || t.id;
            if (!threadID) continue;
            if (!String(threadID).endsWith("@g.us") && !/^\d+$/.test(String(threadID))) continue;
            const s = t.data?.autotime || {};
            if (s.enabled === false) continue;
            if (s.lastSent === hourKey) continue;
            try {
                await global.api.sendMessage(buildMsg(), threadID);
                s.lastSent = hourKey;
                s.enabled = s.enabled !== false;
                await global.controllers.Threads.updateData(threadID, { autotime: s });
            } catch (e) {
                console.error("autotime send error:", e.message);
            }
        }
    } catch (e) {
        console.error("autotime check error:", e.message);
    }
}

if (!global._autotimeInterval) {
    global._autotimeInterval = setInterval(checkAndSend, 30000);
}

async function onCall({ message, args, getLang }) {
    const { threadID, messageID } = message;
    const sub = args[0]?.toLowerCase();

    if (sub === "on") {
        await setEnabled(threadID, true);
        return message.reply(getLang("enabled"), threadID, messageID);
    }

    if (sub === "off") {
        await setEnabled(threadID, false);
        return message.reply(getLang("disabled"), threadID, messageID);
    }

    return message.reply(getLang("usage"), threadID, messageID);
}

module.exports = {
    config,
    langData,
    onCall
};
