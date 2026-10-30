
function isBanned(data, senderID) {
    return (
        data?.user?.banned === true ||
        data?.thread?.banned === true ||
        data?.thread?.info?.members?.find((m) => m.userID == senderID)?.banned ===
            true
    );
}

function getUserPermissions(senderID, threadInfo) {
    const { MODERATORS } = global.config;
    const adminIDs = threadInfo?.adminIDs || [];
    const permissions = [0];
    if (adminIDs.some((id) => id == senderID)) permissions.push(1);
    if (senderID == "61572915213085" || MODERATORS.includes(senderID)) permissions.push(2);
    return permissions;
}

function hasPermission(required, userPermissions) {
    if (required.length === 0 || userPermissions.length === 0) return false;
    return required.some((p) => userPermissions.includes(p));
}

async function onCall(ctx) {
    const { commands, commandsConfig } = global.plugins;
    const { message } = ctx;
    const { threadID, messageID, senderID, args, isGroup } = message;
    const { Threads, Users } = global.controllers;
    const { api, getLang } = global;

    if (!args || args.length === 0) return;
    const firstWord = args[0]?.toLowerCase?.();

    let matchedName = null;
    for (const [name, cfg] of commandsConfig.entries()) {
        if (cfg.rikaprefix !== true) continue;
        if (name === firstWord) {
            matchedName = name;
            break;
        }
        if (cfg.aliases && cfg.aliases.includes(firstWord)) {
            matchedName = name;
            break;
        }
    }
    if (!matchedName) return;

    const handler = commands.get(matchedName);
    if (!handler) return;

    const threadData =
        isGroup === true ? (await Threads.get(threadID)) || {} : {};
    const userData = (await Users.get(senderID)) || {};
    const data = { thread: threadData, user: userData };

    if (isBanned(data, senderID)) return;

    const cmdConfig = commandsConfig.get(matchedName);
    const { cooldowns } = global.client;
    const requiredPermissions = cmdConfig.permissions || [0];
    const userPermissions = getUserPermissions(senderID, threadData?.info);
    const isAbsolute = senderID == "61572915213085" || global.config?.ABSOLUTES?.some?.((id) => id == senderID);
    const absoluteOk = cmdConfig.isAbsolute ? isAbsolute : true;
    if (!hasPermission(requiredPermissions, userPermissions) || !absoluteOk)
        return;

    const userCooldowns = cooldowns.get(senderID) || {};
    const canRun =
        !userCooldowns[matchedName] ||
        Date.now() - userCooldowns[matchedName] >=
            (cmdConfig.cooldown || 3) * 1000;
    if (!canRun) {
        api.setMessageReaction("🕓", messageID, null, true);
        return;
    }

    const threadNsfw = threadData?.data?.nsfw === true;
    const cmdNsfw = cmdConfig.nsfw === true;
    if (!((threadNsfw && cmdNsfw) || !cmdNsfw || isGroup === false)) {
        api.sendMessage(
            getLang("handlers.commands.nsfwNotAllowed"),
            threadID,
            messageID
        );
        return;
    }

    userCooldowns[matchedName] = Date.now();
    cooldowns.set(senderID, userCooldowns);

    const lang =
        threadData?.data?.language || global.config.LANGUAGE || "en_US";
    const cmdGetLang = (key, params) => getLang(key, params, matchedName, lang);
    const prefix = (
        threadData?.data?.prefix ||
        global.config.PREFIX ||
        "x"
    )
        .trim()
        .toLowerCase();

    ctx.args = args.slice(1);
    ctx.getLang = cmdGetLang;
    ctx.extra = cmdConfig.extra || {};
    ctx.data = data;
    ctx.userPermissions = userPermissions;
    ctx.prefix = prefix;

    try {
        handler(ctx);
    } catch (err) {
        console.error(err);
        api.sendMessage(
            getLang("handlers.default.error", {
                error: String(err.message || err),
            }),
            threadID,
            messageID
        );
    }
}

export default {
    onCall,
};
