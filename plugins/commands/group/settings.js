const config = {
    name: "settings",
    aliases: ["setting"],
    description: "Settings for better group management, i changed the permission because of spam.",
    usage: "",
    cooldown: 3,
    permissions: [2],
    credits: "XaviaTeam",
};

const langData = {
    vi_VN: {
        menu: "⌈ CÀI ĐẶT NHÓM ⌋\n\n1. [{antiSpam}] Chống Spam\n2. [{antiOut}] Chống Rời Nhóm\n3. [{antiChangeGroupName}] Chống Đổi Tên Nhóm\n4. [{antiChangeGroupImage}] Chống Đổi Ảnh Nhóm\n5. [{antiChangeNickname}] Chống Đổi Nickname\n\n6. [{notifyChange}] Thông báo các sự kiện nhóm\n\n⇒ Reply với các số thứ tự để chọn cài đặt bạn muốn thay đổi",

        DataNotReady:
            "Dữ liệu chưa sẵn sàng, vui lòng thử lại sau\nHoặc dùng lệnh: ${prefix}refresh và thử lại",
        notGroup: "Lệnh này chỉ có thể được sử dụng trong nhóm!",
        error: "Đã xảy ra lỗi, vui lòng thử lại sau",

        invalid: "Nhập liệu không hợp lệ",
        botNotAdmin:
            "Bot không có quyền quản lý nhóm nên cài đặt antispam và antiout sẽ bị bỏ qua",

        newSettings:
            "Cài đặt mới:\n\n1. [{antiSpam}] Chống Spam\n2. [{antiOut}] Chống Rời Nhóm\n3. [{antiChangeGroupName}] Chống Đổi Tên Nhóm\n4. [{antiChangeGroupImage}] Chống Đổi Ảnh Nhóm\n5. [{antiChangeNickname}] Chống Đổi Nickname\n\n6. [{notifyChange}] Thông báo các sự kiện nhóm\n\n⇒ React 👍 để lưu cài đặt mới",

        success: "Đã thay đổi cài đặt thành công",
    },
    en_US: {
        menu: "⌈ GROUP SETTINGS ⌋\n\n1. [{antiSpam}] Anti Spam\n2. [{antiOut}] Anti Out\n3. [{antiChangeGroupName}] Anti Change Group Name\n4. [{antiChangeGroupImage}] Anti Change Group Image\n5. [{antiChangeNickname}] Anti Change Nickname\n\n6. [{notifyChange}] Notify group events\n\n⇒ Reply with numbers to choose the setting you want to change",
        DataNotReady:
            "Data is not ready, please try again later\nOr use: ${prefix}refresh and try again",
        notGroup: "This command can only be used in group!",
        error: "An error occurred, please try again later",

        invalid: "Invalid input",
        botNotAdmin:
            "Bot is not admin in this group, so antispam and antiout will be ignored",

        newSettings:
            "New setting:\n\n1. [{antiSpam}] Anti Spam\n2. [{antiOut}] Anti Out\n3. [{antiChangeGroupName}] Anti Change Group Name\n4. [{antiChangeGroupImage}] Anti Change Group Image\n5. [{antiChangeNickname}] Anti Change Nickname\n\n6. [{notifyChange}] Notify group events\n\n⇒ React 👍 to save the new settings",

        success: "Successfully changed settings",
    },
    ar_SY: {
        menu: "⌈ اعـدادات الـمـجـموعـة ⌋\n\n1. [{antiSpam}] مكافحة الازعاج\n2. [{antiOut}] مكافحة الخروج\n3. [{antiChangeGroupName}] مكافحة تغيير اسم المجموعة\n4. [{antiChangeGroupImage}] مكافحة تغيير صورة المجموعة\n5. [{antiChangeNickname}] مكافحة تغيير الكنية\n\n6. [{notifyChange}] اخطار احداث المجموعة\n\n⇒ رد بأرقام لاختيار الإعداد الذي تريد تغييره",
        DataNotReady:
            "البيانات ليست جاهزة ، يرجى المحاولة مرة أخرى في وقت لاحق\nاو استعمل: ${prefix}قم بالتحديث وحاول مرة أخرى",
        notGroup: "لا يمكن استخدام هذا الأمر إلا في المجموعة!",
        error: "لقد حدث خطأ، رجاء أعد المحاولة لاحقا",

        invalid: "مدخل غير صالح",
        botNotAdmin:
            "البوت ليس ادمن في هذه المجموعة ، لذلك سيتم تجاهل مكافحة الازعاج ومكافحة الخروج",

        newSettings:
            "اعدادات جديدة:\n\n1. [{antiSpam}] مكافحة الازعاج\n2. [{antiOut}] مكافحة الخروج\n3. [{antiChangeGroupName}] مكافحة تغيير اسم المجموعة\n4. [{antiChangeGroupImage}] مكافحة تغيير صورة المجموعة\n5. [{antiChangeNickname}] مكافحة تغيير الكنية\n\n6. [{notifyChange}] اخطار احداث المجموعة\n\n⇒ تفاعل ب 👍 لحفظ الاعدادات الجديدة",

        success: "تم تغيير الاعدادات بنجاح",
    },
};

async function confirmChange({ message, getLang, data, eventData }) {
    const { reaction } = message;
    if (reaction != "👍") return;

    const { newSettings } = eventData;
    if (!newSettings || !data?.thread?.info)
        return message.send(getLang("error"));

    try {
        await global.controllers.Threads.updateData(message.threadID, {
            antiSettings: newSettings,
        });

        message.send(getLang("success"));
    } catch (e) {
        console.error(e || "WTF");
        message.send(getLang("error"));
    }
}

async function chooseMenu({ message, getLang, data }) {
    try {
        let chosenIndexes = message.args.filter(
            (e) => !!e && !isNaN(e) && e > 0 && e <= 6
        );

        if (chosenIndexes.length == 0) return message.reply(getLang("invalid"));
        const _THREAD = data?.thread;
        if (!_THREAD) return message.reply(getLang("error"));

        const _THREAD_DATA = _THREAD.data;
        const _THREAD_DATA_ANTI_SETTINGS = _THREAD_DATA?.antiSettings;

        const newSettings = {
            antiSpam: _THREAD_DATA_ANTI_SETTINGS?.antiSpam !== false,
            antiOut: _THREAD_DATA_ANTI_SETTINGS?.antiOut !== false,
            antiChangeGroupName:
                _THREAD_DATA_ANTI_SETTINGS?.antiChangeGroupName !== false,
            antiChangeGroupImage:
                _THREAD_DATA_ANTI_SETTINGS?.antiChangeGroupImage !== false,
            antiChangeNickname:
                _THREAD_DATA_ANTI_SETTINGS?.antiChangeNickname !== false,

            notifyChange: _THREAD_DATA_ANTI_SETTINGS?.notifyChange !== false,
        };

        let settingsKeys = Object.keys(newSettings);
        for (const _index of chosenIndexes) {
            const _key = settingsKeys[_index - 1];
            newSettings[_key] = !newSettings[_key];
        }

        let isBotAdmin = data?.thread?.info?.adminIDs?.some(
            (e) => e == global.botID
        );
        if (!isBotAdmin && (newSettings.antiSpam || newSettings.antiOut)) {
            newSettings.antiOut = false;
            newSettings.antiSpam = false;

            await message.reply(getLang("botNotAdmin"));
        }

        const _newSettings = {};

        for (const _key of settingsKeys) {
            _newSettings[_key] = newSettings[_key] ? "✅" : "❌";
        }

        const _newMessage = await message.reply(
            getLang("newSettings", { ..._newSettings })
        );
        _newMessage.addReactEvent({
            callback: confirmChange,
            newSettings,
            participantIDs: message.participantIDs,
        });
    } catch (e) {
        console.error(e || "WTFFF");
        message.reply(getLang("error"));
    }
}

async function onCall({ message, getLang, data, prefix }) {
    if (!data?.thread?.info)
        return message.reply(getLang("DataNotReady", { prefix }));
    if (!data.thread.info.isGroup) return message.reply(getLang("notGroup"));

    const SETTING_KEYS = [
        "antiSpam",
        "antiOut",
        "antiChangeGroupName",
        "antiChangeGroupImage",
        "antiChangeNickname",
        "notifyChange",
    ];

    let antiSettings = data.thread.data?.antiSettings;
    if (!antiSettings) {
        antiSettings = {};
        for (const _key of SETTING_KEYS) antiSettings[_key] = true;
        try {
            await global.controllers.Threads.updateData(message.threadID, {
                antiSettings,
            });
        } catch (e) {
            console.error("settings default save error:", e.message);
        }
    }

    const _THREAD_DATA_ANTI_SETTINGS = { ...antiSettings };
    for (const _key of SETTING_KEYS) {
        _THREAD_DATA_ANTI_SETTINGS[_key] = _THREAD_DATA_ANTI_SETTINGS[_key]
            ? "✅"
            : "❌";
    }

    return message
        .reply(getLang("menu", { ..._THREAD_DATA_ANTI_SETTINGS }))
        .then((_) => _.addReplyEvent({ callback: chooseMenu }))
        .catch((e) => {
            console.error(e || "WTFFF");
            message.reply(getLang("error"));
        });
}

export default {
    config,
    langData,
    onCall,
};
