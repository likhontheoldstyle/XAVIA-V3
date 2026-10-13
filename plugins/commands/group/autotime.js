const moment = require("moment-timezone");

const config = {
    name: "autotime",
    description: "Send hourly time notification to group (always on)",
    usage: "autotime",
    cooldown: 3,
    permissions: [0, 1, 2],
    credits: "Rika"
};

const langData = {
    "en_US": {
        "info": "⏰ Hourly time notification is always ON.\nEvery hour on the hour, the current time will be sent to this group."
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

async function checkAndSend() {
    try {
        const now = moment().tz("Asia/Dhaka");
        if (now.minute() !== 0) return;
        const hourKey = now.format("YYYY-MM-DD-HH");
        const allThreads = global.controllers.Threads.getAll() || [];
        for (const t of allThreads) {
            const threadID = t?.info?.threadID;
            if (!threadID) continue;
            const s = t?.data?.autotime || {};
            if (s.lastSent === hourKey) continue;
            try {
                await global.api.sendMessage(buildMsg(), threadID);
                s.lastSent = hourKey;
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

async function onCall({ message, getLang }) {
    const { threadID, messageID } = message;
    return message.reply(getLang("info"), threadID, messageID);
}

module.exports = {
    config,
    langData,
    onCall
};
