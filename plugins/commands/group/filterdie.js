const config = {
    name: "filterdie",
    aliases: ["cleandie", "removedie"],
    description: "Remove suspended/dead accounts from the group",
    usage: "",
    cooldown: 30,
    permissions: [1],
    credits: "Rika",
};

const langData = {
    en_US: {
        notGroup: "This command only works in groups",
        botNotAdmin: "Bot needs to be group admin to remove members",
        checking: "Checking {count} members for dead accounts...",
        noDie: "No dead accounts found. Group is clean!",
        removing: "Found {count} dead account(s). Removing...",
        done: "Done! Removed {success} dead account(s){fail}",
        failPart: ", failed to remove {fail}",
        error: "An error occurred, please try again later",
    },
    vi_VN: {
        notGroup: "Lệnh này chỉ hoạt động trong nhóm",
        botNotAdmin: "Bot cần làm quản trị viên nhóm để xóa thành viên",
        checking: "Đang kiểm tra {count} thành viên...",
        noDie: "Không tìm thấy tài khoản chết. Nhóm sạch!",
        removing: "Tìm thấy {count} tài khoản chết. Đang xóa...",
        done: "Xong! Đã xóa {success} tài khoản chết{fail}",
        failPart: ", thất bại {fail}",
        error: "Đã có lỗi xảy ra, vui lòng thử lại sau",
    },
    ar_SY: {
        notGroup: "هذا الأمر يعمل في المجموعات فقط",
        botNotAdmin: "يجب أن يكون البوت مشرفًا لإزالة الأعضاء",
        checking: "جارٍ فحص {count} عضو...",
        noDie: "لا توجد حسابات ميتة. المجموعة نظيفة!",
        removing: "تم العثور على {count} حساب ميت. جارٍ الإزالة...",
        done: "تم! تمت إزالة {success} حساب ميت{fail}",
        failPart: ", فشل إزالة {fail}",
        error: "حدث خطأ، يرجى المحاولة لاحقًا",
    },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function checkAlive(uid) {
    return new Promise((resolve) => {
        global.api.getUserInfo([uid], (err, info) => {
            if (err || !info || !info[uid] || !info[uid].name) resolve(false);
            else resolve(true);
        });
    });
}

function removeUser(uid, threadID) {
    return new Promise((resolve, reject) => {
        global.api.removeUserFromGroup(uid, threadID, (err) =>
            err ? reject(err) : resolve()
        );
    });
}

async function onCall({ message, getLang, data }) {
    const { threadID, isGroup, participantIDs } = message;
    if (!isGroup) return message.reply(getLang("notGroup"));
    try {
        const { adminIDs } = data.thread.info;
        if (!adminIDs.some((e) => e == global.botID))
            return message.reply(getLang("botNotAdmin"));

        const targets = participantIDs.filter((id) => id != global.botID);
        await message.reply(getLang("checking", { count: targets.length }));

        const dead = [];
        for (const uid of targets) {
            const alive = await checkAlive(uid);
            if (!alive) {
                await wait(500);
                const aliveAgain = await checkAlive(uid);
                if (!aliveAgain) dead.push(uid);
            }
            await wait(300);
        }

        if (dead.length == 0) return message.reply(getLang("noDie"));
        await message.reply(getLang("removing", { count: dead.length }));

        let success = 0,
            fail = 0;
        for (const uid of dead) {
            try {
                await removeUser(uid, threadID);
                success++;
            } catch (e) {
                fail++;
            }
            await wait(800);
        }

        await message.reply(
            getLang("done", {
                success,
                fail: fail > 0 ? getLang("failPart", { fail }) : "",
            })
        );
    } catch (e) {
        console.error(e);
        message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
