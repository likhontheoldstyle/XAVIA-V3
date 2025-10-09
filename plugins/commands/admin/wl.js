import { writeFileSync } from "fs";
import { resolve as resolvePath } from "path";

const config = {
    name: "wl",
    aliases: ["whitelist"],
    version: "1.0",
    credits: "ArYAN",
    permissions: [2],
    cooldowns: 5,
    description: "Manage whitelist mode and whitelist users",
    usage: "add <uid/@tag> | remove <uid/@tag> | list | on | off",
    category: "admin",
    noprefix: true
};

const langData = {
    en_US: {
        added: "✅ Added whitelist role for {count} users:\n{users}",
        alreadyWhitelisted: "\n⚠️ {count} users already have whitelist role:\n{users}",
        missingIdAdd: "⚠️ Please enter ID or tag user to add to whitelist",
        removed: "✅ Removed whitelist role from {count} users:\n{users}",
        notWhitelisted: "⚠️ {count} users don't have whitelist role:\n{users}",
        missingIdRemove: "⚠️ Please enter ID or tag user to remove from whitelist",
        listWhitelist: "👑 Whitelist Users:\n{users}",
        enable: "✅ Whitelist mode enabled",
        disable: "✅ Whitelist mode disabled",
        noWhitelist: "⚠️ No users in whitelist"
    }
};

async function onCall({ message, args, getLang, data }) {
    const { threadID, senderID, messageID } = message;
    const { Users } = global.controllers;
    
    if (!global.config.whiteListMode) {
        global.config.whiteListMode = {
            enable: false,
            whiteListIds: []
        };
    }
    
    try {
        const query = args[0]?.toLowerCase();
        
        switch (query) {
            case "add":
            case "-a": {
                if (!args[1]) {
                    return message.reply(getLang("missingIdAdd"));
                }
                
                let uids = [];
                if (Object.keys(message.mentions || {}).length > 0) {
                    uids = Object.keys(message.mentions);
                } else if (message.messageReply) {
                    uids.push(message.messageReply.senderID);
                } else {
                    uids = args.slice(1).filter(arg => !isNaN(arg));
                }
                
                const notWhitelistedIds = [];
                const whitelistedIds = [];
                
                for (const uid of uids) {
                    if (global.config.whiteListMode.whiteListIds.includes(uid)) {
                        whitelistedIds.push(uid);
                    } else {
                        notWhitelistedIds.push(uid);
                    }
                }
                
                global.config.whiteListMode.whiteListIds.push(...notWhitelistedIds);
                
                const getNames = await Promise.all(uids.map(uid => 
                    Users.getName(uid).then(name => ({ uid, name }))
                ));
                
                global.config.save();
                
                let replyMsg = "";
                if (notWhitelistedIds.length > 0) {
                    replyMsg += getLang("added", { 
                        count: notWhitelistedIds.length, 
                        users: getNames.filter(u => notWhitelistedIds.includes(u.uid))
                            .map(({ uid, name }) => `• ${name} (${uid})`).join("\n") 
                    });
                }
                if (whitelistedIds.length > 0) {
                    replyMsg += (replyMsg ? "\n\n" : "") + getLang("alreadyWhitelisted", { 
                        count: whitelistedIds.length, 
                        users: whitelistedIds.map(uid => `• ${uid}`).join("\n") 
                    });
                }
                
                return message.reply(replyMsg);
            }
            
            case "remove":
            case "-r": {
                if (!args[1]) {
                    return message.reply(getLang("missingIdRemove"));
                }
                
                let uids = [];
                if (Object.keys(message.mentions || {}).length > 0) {
                    uids = Object.keys(message.mentions);
                } else {
                    uids = args.slice(1).filter(arg => !isNaN(arg));
                }
                
                const notWhitelistedIds = [];
                const whitelistedIds = [];
                
                for (const uid of uids) {
                    if (global.config.whiteListMode.whiteListIds.includes(uid)) {
                        whitelistedIds.push(uid);
                    } else {
                        notWhitelistedIds.push(uid);
                    }
                }
                
                for (const uid of whitelistedIds) {
                    const index = global.config.whiteListMode.whiteListIds.indexOf(uid);
                    global.config.whiteListMode.whiteListIds.splice(index, 1);
                }
                
                const getNames = await Promise.all(whitelistedIds.map(uid => 
                    Users.getName(uid).then(name => ({ uid, name }))
                ));
                
                global.config.save();
                
                let replyMsg = "";
                if (whitelistedIds.length > 0) {
                    replyMsg += getLang("removed", { 
                        count: whitelistedIds.length, 
                        users: getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n") 
                    });
                }
                if (notWhitelistedIds.length > 0) {
                    replyMsg += (replyMsg ? "\n\n" : "") + getLang("notWhitelisted", { 
                        count: notWhitelistedIds.length, 
                        users: notWhitelistedIds.map(uid => `• ${uid}`).join("\n") 
                    });
                }
                
                return message.reply(replyMsg);
            }
            
            case "list":
            case "-l": {
                if (global.config.whiteListMode.whiteListIds.length === 0) {
                    return message.reply(getLang("noWhitelist"));
                }
                
                const getNames = await Promise.all(
                    global.config.whiteListMode.whiteListIds.map(uid => 
                        Users.getName(uid).then(name => ({ uid, name }))
                    )
                );
                
                return message.reply(getLang("listWhitelist", { 
                    users: getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n") 
                }));
            }
            
            case "on": {
                global.config.whiteListMode.enable = true;
                global.config.save();
                return message.reply(getLang("enable"));
            }
            
            case "off": {
                global.config.whiteListMode.enable = false;
                global.config.save();
                return message.reply(getLang("disable"));
            }
            
            default:
                return message.reply(`Usage:\n- ${config.usage}`);
        }
    } catch (err) {
        console.error(err);
        message.reply("❌ Error: " + (err.message || err));
    }
}

export default {
    config,
    langData,
    onCall
};
