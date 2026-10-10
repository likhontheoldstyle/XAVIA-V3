import axios from "axios";

const apiJsonUrl =
    "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-OFFICIAL/Nayan/main/api.json";

const greetings = [
    "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
    "কি গো সোনা আমাকে ডাকছ কেনো",
    "বার বার আমাকে ডাকস কেন😡",
    "আহ শোনা আমার আমাকে এতো ডাক্তাছো কেনো আসো বুকে আশো🥱",
    "হুম জান তোমার অইখানে উম্মমাহ😷😘",
    "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি",
    "আমাকে এতো না ডেকে বস নয়নকে একটা গফ দে 🙄",
    "jang hanga korba",
    "jang bal falaba🙂",
];

const config = {
    name: "bot",
    aliases: ["sim"],
    description: "Chat with AI bot",
    usage: "[message]",
    cooldown: 5,
    permissions: [0],
    credits: "Mohammad Nayan",
    rikaprefix: true,
    category: "nix"
};

const langData = {
    en_US: {
        apiFail: "❌ Something went wrong while talking with bot.",
        replyFail: "❌ Failed to continue conversation.",
        noResponse: "🤖 I'm not sure how to respond to that.",
    },
    vi_VN: {
        apiFail: "❌ Đã có lỗi xảy ra khi trò chuyện với bot.",
        replyFail: "❌ Không thể tiếp tục cuộc trò chuyện.",
        noResponse: "🤖 Tôi không chắc phải trả lời thế nào.",
    },
    ar_SY: {
        apiFail: "❌ حدث خطأ أثناء التحدث مع البوت.",
        replyFail: "❌ فشل في متابعة المحادثة.",
        noResponse: "🤖 لست متأكدًا كيف أرد على ذلك.",
    },
};

let simApiBase = null;

async function getSimApi() {
    if (simApiBase) return simApiBase;
    const res = await axios.get(apiJsonUrl);
    simApiBase = res.data.api;
    return simApiBase;
}

async function askSim(text, senderID, getLang) {
    const base = await getSimApi();
    const res = await axios.get(
        `${base}/sim?type=ask&ask=${encodeURIComponent(text)}&number=${senderID}`
    );
    return res.data?.data?.msg || getLang("noResponse");
}

function formatReply(name, replyText) {
    return (
        "╭────────────❍\n" +
        `╰➤ 👤 𝐃𝐞𝐚𝐫『 ${name} 』,\n` +
        `╰➤ 🗣 ${replyText}\n` +
        "╰─────────────────➤"
    );
}

async function sendBotReply(message, senderID, replyText) {
    const { Users } = global.controllers;
    const name = await Users.getName(senderID).catch(() => senderID);
    const sentMsg = await message.reply({
        body: formatReply(name, replyText),
        mentions: [{ tag: name, id: senderID }],
    });
    sentMsg.addReplyEvent({
        callback: handleReply,
        author: senderID,
    });
}

async function handleReply({ message, getLang }) {
    const { senderID, body } = message;
    if (!body) return;
    try {
        const replyText = await askSim(body, senderID, getLang);
        await sendBotReply(message, senderID, replyText);
    } catch (e) {
        console.error(e);
        message.reply(getLang("replyFail"));
    }
}

async function onCall({ message, args, getLang }) {
    const { senderID } = message;
    const text = args.join(" ").trim();
    try {
        if (!text) {
            const replyText =
                greetings[Math.floor(Math.random() * greetings.length)];
            return sendBotReply(message, senderID, replyText);
        }
        const replyText = await askSim(text, senderID, getLang);
        await sendBotReply(message, senderID, replyText);
    } catch (e) {
        console.error(e);
        message.reply(getLang("apiFail"));
    }
}

export default {
    config,
    langData,
    onCall,
};
