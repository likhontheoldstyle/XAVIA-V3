const config = {
    name: "pp",
    aliases: ["profile"],
    description: "Get profile picture",
    usage: "[@tag/reply/uid/link]",
    cooldown: 5,
    permissions: [0],
    credits: "Samir | LIKHON AHMED",
};

const langData = {
    en_US: {
        error: "Could not get profile picture, please try again later",
    },
    vi_VN: {
        error: "Không thể lấy ảnh đại diện, vui lòng thử lại sau",
    },
    ar_SY: {
        error: "تعذر الحصول على الصورة الشخصية، حاول لاحقًا",
    },
};

function avatarUrl(uid) {
    return `https://graph.facebook.com/${uid}/picture?width=720&height=720`;
}

function extractUid(arg) {
    if (!arg) return null;
    if (/^\d+$/.test(arg)) return arg;
    const idParam = arg.match(/[?&]id=(\d+)/);
    if (idParam) return idParam[1];
    const m = arg.match(/(\d{5,})/);
    return m ? m[1] : null;
}

async function onCall({ message, args, getLang }) {
    const { senderID, mentions, type, messageReply, reply } = message;
    try {
        let uid = senderID;
        if (type === "message_reply" && messageReply) {
            uid = messageReply.senderID;
        } else if (mentions && Object.keys(mentions).length > 0) {
            uid = Object.keys(mentions)[0];
        } else if (args[0]) {
            uid = extractUid(args[0]) || senderID;
        }

        const stream = await getStream(avatarUrl(uid));
        await reply({ attachment: stream });
    } catch (e) {
        console.error(e);
        reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
