const moment = require("moment-timezone");

const config = {
    name: "autotime",
    description: "Send automatic messages to group at set times",
    usage: "add <HH:MM> <message> | list | del <index> | on | off",
    cooldown: 3,
    permissions: [1, 2],
    credits: "Rika"
};

const langData = {
    "en_US": {
        "added": "✅ Auto message added for {time}\n💬 {msg}",
        "invalidTime": "❌ Invalid time format. Use HH:MM (24h), e.g. 08:00",
        "noMsg": "❌ Please provide a message.",
        "list": "⏰ Auto messages:\n{list}",
        "empty": "No auto messages set.",
        "deleted": "✅ Deleted auto message #{index}",
        "invalidIndex": "❌ Invalid index.",
        "enabled": "✅ Auto time messages enabled.",
        "disabled": "❌ Auto time messages disabled.",
        "usage": "Usage:\n/autotime add <HH:MM> <message>\n/autotime list\n/autotime del <index>\n/autotime on | off"
    }
};

function getDhakaTime() {
    return moment().tz("Asia/Dhaka").format("HH:mm");
}

async function getSchedules(threadID) {
    const data = await global.controllers.Threads.getData(threadID);
    return data?.autotime || { enabled: true, list: [] };
}

async function saveSchedules(threadID, schedules) {
    await global.controllers.Threads.updateData(threadID, { autotime: schedules });
}

async function checkAndSend() {
    try {
        const now = getDhakaTime();
        const allThreads = await global.controllers.Threads.getAll?.() || [];
        for (const t of allThreads) {
            const threadID = t.threadID || t.id;
            if (!threadID) continue;
            const s = t.data?.autotime;
            if (!s || s.enabled === false || !s.list?.length) continue;
            for (const item of s.list) {
                if (item.time === now && item.lastSent !== now + "_" + moment().tz("Asia/Dhaka").format("YYYY-MM-DD")) {
                    try {
                        await global.api.sendMessage(item.msg, threadID);
                        item.lastSent = now + "_" + moment().tz("Asia/Dhaka").format("YYYY-MM-DD");
                        await saveSchedules(threadID, s);
                    } catch (e) {
                        console.error("autotime send error:", e.message);
                    }
                }
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

    if (sub === "add") {
        const time = args[1];
        const msg = args.slice(2).join(" ");
        if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
            return message.reply(getLang("invalidTime"), threadID, messageID);
        }
        if (!msg) {
            return message.reply(getLang("noMsg"), threadID, messageID);
        }
        const [h, m] = time.split(":").map(Number);
        if (h > 23 || m > 59) {
            return message.reply(getLang("invalidTime"), threadID, messageID);
        }
        const normTime = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
        const s = await getSchedules(threadID);
        s.list.push({ time: normTime, msg });
        await saveSchedules(threadID, s);
        return message.reply(
            getLang("added").replace("{time}", normTime).replace("{msg}", msg),
            threadID, messageID
        );
    }

    if (sub === "list") {
        const s = await getSchedules(threadID);
        if (!s.list.length) {
            return message.reply(getLang("empty"), threadID, messageID);
        }
        const list = s.list.map((x, i) => `${i + 1}. ⏰ ${x.time} — ${x.msg}`).join("\n");
        return message.reply(getLang("list").replace("{list}", list), threadID, messageID);
    }

    if (sub === "del" || sub === "delete" || sub === "remove") {
        const idx = parseInt(args[1]) - 1;
        const s = await getSchedules(threadID);
        if (isNaN(idx) || idx < 0 || idx >= s.list.length) {
            return message.reply(getLang("invalidIndex"), threadID, messageID);
        }
        s.list.splice(idx, 1);
        await saveSchedules(threadID, s);
        return message.reply(getLang("deleted").replace("{index}", args[1]), threadID, messageID);
    }

    if (sub === "on") {
        const s = await getSchedules(threadID);
        s.enabled = true;
        await saveSchedules(threadID, s);
        return message.reply(getLang("enabled"), threadID, messageID);
    }

    if (sub === "off") {
        const s = await getSchedules(threadID);
        s.enabled = false;
        await saveSchedules(threadID, s);
        return message.reply(getLang("disabled"), threadID, messageID);
    }

    return message.reply(getLang("usage"), threadID, messageID);
}

module.exports = {
    config,
    langData,
    onCall
};
