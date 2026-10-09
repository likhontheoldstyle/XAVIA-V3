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
        checking: "Checking group members for dead accounts...",
        noDie: "No dead accounts found. Group is clean!",
        removing: "Found {count} dead account(s). Removing...",
        done: "Removed {success} dead account(s){fail}",
        failPart: ", failed to remove {fail}",
        error: "An error occurred, please try again later",
    },
    vi_VN: {
        notGroup: "Lệnh này chỉ hoạt động trong nhóm",
        botNotAdmin: "Bot cần làm quản trị viên nhóm để xóa thành viên",
        checking: "Đang kiểm tra thành viên nhóm...",
        noDie: "Không tìm thấy tài khoản chết. Nhóm sạch!",
        removing: "Tìm thấy {count} tài khoản chết. Đang xóa...",
        done: "Đã xóa {success} tài khoản chết{fail}",
        failPart: ", thất bại {fail}",
        error: "Đã có lỗi xảy ra, vui lòng thử lại sau",
    },
    ar_SY: {
        notGroup: "هذا الأمر يعمل في المجموعات فقط",
        botNotAdmin: "يجب أن يكون البوت مشرفًا لإزالة الأعضاء",
        checking: "جارٍ فحص أعضاء المجموعة...",
        noDie: "لا توجد حسابات ميتة. المجموعة نظيفة!",
        removing: "تم العثور على {count} حساب ميت. جارٍ الإزالة...",
        done: "تمت إزالة {success} حساب ميت{fail}",
        failPart: ", فشل إزالة {fail}",
        error: "حدث خطأ، يرجى المحاولة لاحقًا",
    },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function normID(e) {
    if (e && typeof e === "object") return e.id || e.userID || e.userFbId;
    return e;
}

function isBotAdmin(adminIDs, botID) {
    if (!Array.isArray(adminIDs)) return false;
    return adminIDs.some((e) => normID(e) == botID);
}

function fetchThreadInfo(threadID) {
    return new Promise((resolve) => {
        global.api.getThreadInfo(threadID, (err, info) => {
            if (err || !info) return resolve(null);
            resolve(info);
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
    const { threadID, isGroup } = message;
    if (!isGroup) return message.reply(getLang("notGroup"));
    try {
        let threadInfo = await fetchThreadInfo(threadID);
        if (!threadInfo && data.thread && data.thread.info)
            threadInfo = data.thread.info;
        if (!threadInfo) return message.reply(getLang("error"));

        const adminIDs = threadInfo.adminIDs || [];
        if (!isBotAdmin(adminIDs, global.botID))
            return message.reply(getLang("botNotAdmin"));

        await message.reply(getLang("checking"));

        const userInfo = threadInfo.userInfo || [];
        const membersBlocked = userInfo.filter(
            (user) =>
                user.type !== "User" &&
                !adminIDs.some((id) => normID(id) == user.id)
        );

        if (membersBlocked.length == 0)
            return message.reply(getLang("noDie"));
        await message.reply(
            getLang("removing", { count: membersBlocked.length })
        );

        let success = 0,
            fail = 0;
        for (const user of membersBlocked) {
            try {
                await removeUser(user.id, threadID);
                success++;
            } catch (e) {
                fail++;
            }
            await wait(700);
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
