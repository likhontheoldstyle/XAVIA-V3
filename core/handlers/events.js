
import { readFileSync, existsSync } from "fs";
import { resolve as resolvePath } from "path";

let resendPlugin;

function isBanned(data, userID) {
    return (
        data?.user?.banned === true ||
        data?.thread?.banned === true ||
        data?.thread?.info?.members?.find((m) => m.userID == userID)?.banned ===
            true
    );
}

function buildMessage(event, { type, commandName }) {
    const { api } = global;
    const { threadID, messageID, senderID, userID } = event;
    const isReaction = type === "reaction";

    const wrapSent = (sentInfo, targetThreadID) => {
        const eventData = {
            threadID: targetThreadID,
            messageID: sentInfo.messageID,
            author: isReaction ? userID : senderID,
            author_only: true,
            name: commandName,
        };

        sentInfo.addReplyEvent = function (opts = {}, timeout = 60000) {
            if (typeof opts !== "object" || Array.isArray(opts)) return;
            if (typeof opts.callback !== "function") return;
            const data = Object.assign(eventData, opts);
            global.client.replies.set(data.messageID, data);
            if (timeout > 0) {
                setTimeout(() => {
                    if (global.client.replies.has(data.messageID)) {
                        global.client.replies.delete(data.messageID);
                    }
                }, timeout);
            }
        };

        sentInfo.addReactEvent = function (opts = {}, timeout = 60000) {
            if (typeof opts !== "object" || Array.isArray(opts)) return;
            if (typeof opts.callback !== "function") return;
            const data = Object.assign(eventData, opts);
            global.client.reactions.set(data.messageID, data);
            if (timeout > 0) {
                setTimeout(() => {
                    if (global.client.reactions.has(data.messageID)) {
                        global.client.reactions.delete(data.messageID);
                    }
                }, timeout);
            }
        };

        sentInfo.unsend = function (delay = 0) {
            const full = Object.assign(eventData, sentInfo);
            setTimeout(
                () => {
                    api.unsendMessage(full.messageID);
                },
                delay > 0 ? delay : 0
            );
        };

        return sentInfo;
    };

    const methods = {
        send: function (content, targetThreadID = null, extra = null) {
            return new Promise((resolve, reject) => {
                const target = targetThreadID || threadID;
                api.sendMessage(
                    content,
                    target,
                    (err, info) => {
                        if (err) reject(err);
                        else resolve(wrapSent(info, target));
                    },
                    extra || null
                );
            });
        },
        reply: function (content) {
            return new Promise((resolve, reject) => {
                api.sendMessage(
                    content,
                    threadID,
                    (err, info) => {
                        if (err) reject(err);
                        else resolve(wrapSent(info, threadID));
                    },
                    messageID
                );
            });
        },
        react: function (emoji) {
            return new Promise((resolve, reject) => {
                api.setMessageReaction(
                    emoji,
                    messageID,
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    },
                    true
                );
            });
        },
    };

    if (isReaction) {
        delete methods.reply;
        delete methods.react;
    }

    return methods;
}

function resolveCommandName(name) {
    const aliases = global.plugins.commandsAliases;
    const commands = global.plugins.commands;
    if (commands.has(name)) return name;
    for (const [cmdName, aliasList] of aliases) {
        if (aliasList.includes(name)) return cmdName;
    }
    return null;
}

function getUserPermissions(senderID, threadInfo) {
    const { MODERATORS } = global.config;
    const adminIDs = threadInfo?.adminIDs || [];
    const permissions = [0];
    if (adminIDs.some((id) => id == senderID)) permissions.push(1);
    if (MODERATORS.includes(senderID)) permissions.push(2);
    return permissions;
}

function hasPermission(required, userPermissions) {
    if (required.length === 0 || userPermissions.length === 0) return false;
    return required.some((p) => userPermissions.includes(p));
}

async function handleCommand(event) {
    const { threadID, messageID, senderID, args } = event;
    const { Threads, Users } = global.controllers;
    const thread = event.isGroup === true ? (await Threads.get(threadID)) || {} : {};
    const user = (await Users.get(senderID)) || {};
    const data = { thread, user };

    if (isBanned(data, senderID)) return;

    const prefix = (thread?.data?.prefix || global.config.PREFIX || "x")
        .trim()
        .toLowerCase();
    const prefixMode = (global.config.PREFIX_MODE || "prefix").toLowerCase();
    if (!(args.length > 0)) return;
    const hasPrefix = args[0].toLowerCase().startsWith(prefix);
    if (prefixMode === "prefix" && !hasPrefix) return;

    const { api, getLang } = global;
    const rawName = hasPrefix
        ? args[0].slice(prefix.length)?.toLowerCase?.()
        : args[0]?.toLowerCase?.();
    const cmdName = resolveCommandName(rawName);
    const handler = global.plugins.commands.get(cmdName) || null;
    const cmdConfig = global.plugins.commandsConfig.get(cmdName);

    if (handler !== null) {
        const { cooldowns } = global.client;
        const requiredPerms = cmdConfig.permissions || [0];
        const userPerms = getUserPermissions(senderID, thread?.info);
        const isAbsolute = global.config?.ABSOLUTES?.some?.((id) => id == senderID);
        const absoluteOk = cmdConfig.isAbsolute ? isAbsolute : true;
        if (!hasPermission(requiredPerms, userPerms) || !absoluteOk) return;

        const userCooldowns = cooldowns.get(senderID) || {};
        const canRun =
            !userCooldowns[cmdName] ||
            Date.now() - userCooldowns[cmdName] >=
                (cmdConfig.cooldown || 3) * 1000;
        if (!canRun) {
            api.setMessageReaction("🕓", messageID, null, true);
            return;
        }

        const threadNsfw = thread?.data?.nsfw === true;
        const cmdNsfw = cmdConfig.nsfw === true;
        if (!((threadNsfw && cmdNsfw) || !cmdNsfw || event.isGroup === false)) {
            api.sendMessage(
                getLang("handlers.commands.nsfwNotAllowed"),
                threadID,
                messageID
            );
            return;
        }

        userCooldowns[cmdName] = Date.now();
        cooldowns.set(senderID, userCooldowns);

        const lang = thread?.data?.language || global.config.LANGUAGE || "en_US";
        const cmdGetLang = (key, params) => getLang(key, params, cmdName, lang);
        const msgApi = buildMessage(event, { type: "command", commandName: cmdName });
        Object.assign(event, msgApi);
        const extra = cmdConfig.extra || {};

        try {
            handler({
                message: event,
                args: [...args].slice(1),
                getLang: cmdGetLang,
                extra,
                data,
                userPermissions: userPerms,
                prefix,
            });
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
    } else {
        if (!hasPrefix && prefixMode !== "prefix") return;
        const input = hasPrefix
            ? args[0].slice(prefix.length)?.toLowerCase?.()
            : args[0]?.toLowerCase?.();
        const langFile = resolvePath("./language/rika.txt");
        if (!input) {
            return;
        } else {
            let msg = `Command "${input}" does not exist, type ${prefix}help to see all available commands`;
            try {
                if (existsSync(langFile)) {
                    const content = readFileSync(langFile, "utf8");
                    const m = content.match(/unknown=(.+)/);
                    if (m)
                        msg = m[1]
                            .replace("{command}", input)
                            .replace("{prefix}", prefix);
                }
            } catch (e) {
                console.error("Error reading language/rika.txt:", e);
            }
            api.sendMessage(msg, threadID, messageID);
        }
    }
}

async function handleReaction(event) {
    const { threadID, messageID, userID, reaction } = event;
    const { Threads, Users } = global.controllers;
    const { api } = global;

    const unsendEmojis = global.config?.unsend || [];
    const isMod =
        global.config?.MODERATORS?.includes?.(userID) ||
        global.config?.ABSOLUTES?.includes?.(userID);
    if (unsendEmojis.includes(reaction) && isMod) {
        try {
            await api.unsendMessage(messageID);
            return;
        } catch (e) {
            console.error("Failed to unsend message:", e);
        }
    }

    if (!global.client.reactions.has(messageID)) return;

    const thread =
        event.senderID != event.threadID && event.userID != event.threadID
            ? (await Threads.get(threadID)) || {}
            : {};
    const user = (await Users.get(userID)) || {};
    const data = { user, thread };

    if (isBanned(data, userID)) return;

    const { getLang } = global;
    const reactHandler = global.client.reactions.get(messageID);
    const name = reactHandler.name;
    if (reactHandler.author_only === true && reactHandler.author !== userID)
        return;

    const lang = thread?.data?.language || global.config.LANGUAGE || "en_US";
    const cmdGetLang = (key, params) => getLang(key, params, name, lang);
    const msgApi = buildMessage(event, { type: "reaction", commandName: name });
    Object.assign(event, msgApi);
    const eventData = Object.assign({}, reactHandler);
    delete eventData.callback;

    try {
        reactHandler.callback({ message: event, getLang: cmdGetLang, data, eventData });
    } catch (e) {
        console.error(e);
        api.sendMessage(
            getLang("handlers.default.error", { error: String(e.message || e) }),
            threadID,
            messageID
        );
    }
}

async function handleReply(event) {
    const { threadID, messageID, senderID, messageReply } = event;
    if (!messageReply) return;

    const { Threads, Users } = global.controllers;
    if (!global.client.replies.has(messageReply.messageID)) return;

    const thread =
        event.isGroup === true ? (await Threads.get(threadID)) || {} : {};
    const user = (await Users.get(senderID)) || {};
    const data = { user, thread };

    if (isBanned(data, senderID)) return;

    const { api, getLang } = global;
    const replyHandler = global.client.replies.get(messageReply.messageID);
    const name = replyHandler.name;
    if (replyHandler.author_only === true && replyHandler.author !== senderID)
        return;

    const lang = thread?.data?.language || global.config.LANGUAGE || "en_US";
    const cmdGetLang = (key, params) => getLang(key, params, name, lang);
    const msgApi = buildMessage(event, { type: "reply", commandName: name });
    Object.assign(event, msgApi);
    const eventData = Object.assign({}, replyHandler);
    delete eventData.callback;

    try {
        replyHandler.callback({ message: event, getLang: cmdGetLang, data, eventData });
    } catch (e) {
        console.error(e);
        api.sendMessage(
            getLang("handlers.default.error", { error: String(e.message || e) }),
            threadID,
            messageID
        );
    }
}

async function handleMessage(event) {
    const { getLang } = global;
    const { threadID, senderID } = event;
    const { Threads, Users } = global.controllers;

    const thread =
        event.isGroup === true ? (await Threads.get(threadID)) || {} : {};
    const user = (await Users.get(senderID)) || {};
    const data = { user, thread };

    if (isBanned(data, senderID)) return;

    for (const [pluginName, onCall] of global.plugins.onMessage.entries()) {
        try {
            const lang =
                thread?.data?.language || global.config.LANGUAGE || "en_US";
            const pluginGetLang = (key, params) => getLang(key, params, pluginName, lang);
            const msgApi = buildMessage(event, {
                type: "message",
                commandName: pluginName,
            });
            Object.assign(event, msgApi);
            onCall({ message: event, getLang: pluginGetLang, data });
        } catch (e) {
            console.error(e);
        }
    }
}

function handleUnsend(event) {
    if (event.senderID == event.threadID || global.botID == event.threadID)
        return;
    resendPlugin.default({ event });
}

function handleEvent(event) {
    try {
        switch (event.type) {
            case "event": {
                switch (event.logMessageType) {
                    case "log:subscribe":
                        global.plugins.events.get("subcribe")({ event });
                        break;
                    case "log:unsubscribe":
                        global.plugins.events.get("unsubcribe")({ event });
                        break;
                    case "log:user-nickname":
                        global.plugins.events.get("user-nickname")({ event });
                        break;
                    case "log:thread-call":
                        global.plugins.events.get("thread-call")({ event });
                        break;
                    case "log:thread-name":
                    case "log:thread-color":
                    case "log:thread-icon":
                    case "log:thread-approval-mode":
                    case "log:thread-admins":
                        global.plugins.events.get("thread-update")({ event });
                        break;
                    case "log:thread-image":
                        global.plugins.events.get("thread-image")({ event });
                        break;
                    default:
                        break;
                }
                break;
            }
            case "change_thread_image":
                global.plugins.events.get("thread-image")({ event });
                break;
            default:
                break;
        }
    } catch (e) {
        console.error(e);
    }
}

export default async function () {
    resendPlugin = await import("../../plugins/resend.js");
    return {
        handleCommand,
        handleReaction,
        handleReply,
        handleMessage,
        handleUnsend,
        handleEvent,
    };
}
