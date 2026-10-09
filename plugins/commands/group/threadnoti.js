const config = {
    name: "threadnoti",
    permissions: [1, 2],
    description: "Turn on/off thread notification for yourself or in group",
    usage: "[on/off] | group [on/off]",
    cooldown: 5,
    credits: "XaviaTeam"
}

const langData = {
    "en_US": {
        "threadnoti.on": "Thread notification has been turned on.",
        "threadnoti.off": "Thread notification has been turned off.",
        "threadnoti.alreadyOn": "Thread notification is already turned on.",
        "threadnoti.alreadyOff": "Thread notification is already turned off.",
        "threadnoti.groupOn": "Group notification has been turned on. Events will be announced in this group.",
        "threadnoti.groupOff": "Group notification has been turned off.",
        "threadnoti.groupAlreadyOn": "Group notification is already turned on.",
        "threadnoti.groupAlreadyOff": "Group notification is already turned off.",
        "error": "An error occurred, please try again later."
    },
    "vi_VN": {
        "threadnoti.on": "Thông báo nhóm đã được bật.",
        "threadnoti.off": "Thông báo nhóm đã được tắt.",
        "threadnoti.alreadyOn": "Thông báo nhóm đã được bật từ trước.",
        "threadnoti.alreadyOff": "Thông báo nhóm đã được tắt từ trước.",
        "threadnoti.groupOn": "Thông báo trong nhóm đã được bật.",
        "threadnoti.groupOff": "Thông báo trong nhóm đã được tắt.",
        "threadnoti.groupAlreadyOn": "Thông báo trong nhóm đã được bật từ trước.",
        "threadnoti.groupAlreadyOff": "Thông báo trong nhóm đã được tắt từ trước.",
        "error": "Đã có lỗi xảy ra, vui lòng thử lại sau."
    },
    "ar_SY": {
        "threadnoti.on": "تم تشغيل إعلامات المجموعة.",
        "threadnoti.off": "تم إيقاف تشغيل إعلامات المجموعة.",
        "threadnoti.alreadyOn": "تم تمكين إعلامات المجموعة بالفعل.",
        "threadnoti.alreadyOff": "تم إيقاف تشغيل إعلامات المجموعة من قبل.",
        "threadnoti.groupOn": "تم تشغيل الإشعارات داخل المجموعة.",
        "threadnoti.groupOff": "تم إيقاف الإشعارات داخل المجموعة.",
        "threadnoti.groupAlreadyOn": "إشعارات المجموعة مفعّلة بالفعل.",
        "threadnoti.groupAlreadyOff": "إشعارات المجموعة متوقفة بالفعل.",
        "error": "لقد حدث خطأ، رجاء أعد المحاولة لاحقا."
    }
}

async function getNotifyChange(threadID) {
    const { Threads } = global.controllers;
    let threadData = await Threads.getData(threadID) || null;
    if (!threadData) throw "No Thread Data";
    return threadData.notifyChange || { status: false, registered: [] };
}

async function saveNotifyChange(threadID, notifyChange) {
    const { Threads } = global.controllers;
    await Threads.updateData(threadID, { notifyChange: notifyChange });
}

async function changeConfig(threadID, senderID, option) {
    let notifyChange = await getNotifyChange(threadID);

    let currentSetting = notifyChange.status == true ? notifyChange.registered.includes(String(senderID)) ? true : false : false;
    if (option == null) {
        option = !currentSetting;
    } else if (option == currentSetting) {
        throw "Already";
    } else {
        option = Boolean(option);
    }

    if (option == true && notifyChange.registered.includes(String(senderID)) == false) {
        notifyChange.registered.push(String(senderID));
    } else if (option == false && notifyChange.registered.includes(String(senderID)) == true) {
        notifyChange.registered.splice(notifyChange.registered.indexOf(String(senderID)), 1);
    } else {
        throw "Already";
    }

    if (notifyChange.registered.length == 0) {
        notifyChange.status = false;
    } else {
        notifyChange.status = true;
    }

    await saveNotifyChange(threadID, notifyChange);
    return option;
}

async function changeGroupConfig(threadID, option) {
    let notifyChange = await getNotifyChange(threadID);

    if (option == null) {
        option = !notifyChange.inGroup;
    } else if (Boolean(notifyChange.inGroup) == option) {
        throw "AlreadyGroup";
    } else {
        option = Boolean(option);
    }

    notifyChange.inGroup = option;
    await saveNotifyChange(threadID, notifyChange);
    return option;
}

async function onCall({ message, args, getLang }) {
    if (!message.isGroup) return;
    const { threadID, senderID, reply } = message;
    const isGroupMode = args[0]?.toLowerCase() == "group";
    const rawOpt = isGroupMode ? args[1]?.toLowerCase() : args[0]?.toLowerCase();
    try {
        let option = rawOpt == "on" ? true : rawOpt == "off" ? false : null;
        if (isGroupMode) {
            option = await changeGroupConfig(threadID, option);
            reply(getLang(option ? "threadnoti.groupOn" : "threadnoti.groupOff"));
        } else {
            option = await changeConfig(threadID, senderID, option);
            reply(getLang(option ? "threadnoti.on" : "threadnoti.off"));
        }
    } catch (e) {
        if (e == "AlreadyGroup") {
            reply(getLang(rawOpt == "off" ? "threadnoti.groupAlreadyOff" : "threadnoti.groupAlreadyOn"));
        } else if (e == "Already") {
            reply(getLang(rawOpt == "off" ? "threadnoti.alreadyOff" : "threadnoti.alreadyOn"));
        } else {
            reply(getLang("error"));
        }
    }
}

export default {
    config,
    langData,
    onCall
}
