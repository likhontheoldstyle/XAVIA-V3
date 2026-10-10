const config = {
    name: "help",
    _name: {
        "ar_SY": "الاوامر"
    },
    aliases: ["cmds", "commands"],
    version: "1.0.3",
    description: "Show all commands or command details",
    usage: "[command] (optional)",
    credits: "XaviaTeam",
    rikaprefix: true
}

const langData = {
    "en_US": {
        "help.list": "{list}\n\n‎╭────────────❍\n╰➤ ⚙️『 Total: {total} commands 』\n\n╰➤ 🗣 {syntax}help [cmd] to get info\n╰─────────────────➤",
        "help.commandNotExists": "Command {command} does not exists.",
        "help.commandDetails": `
╭────────────❍
╰➤ 📂『 {uname} 』

╰➤ 🏷️ 𝐍𝐀𝐌𝐄: {name}

╰➤ 🔗 𝐀𝐋𝐈𝐀𝐒𝐄𝐒: {aliases}

╰➤ 🆚 𝐕𝐄𝐑𝐒𝐈𝐎𝐍: {version}

╰➤ 📝 𝐃𝐄𝐒𝐂𝐑𝐈𝐏𝐓𝐈𝐎𝐍: {description}

╰➤ 💡 𝐔𝐒𝐀𝐆𝐄: {usage}

╰➤ 👤 𝐏𝐄𝐑𝐌𝐈𝐒𝐒𝐈𝐎𝐍𝐒: {permissions}

╰➤ 📁 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘: {category}

╰➤ ⏱️ 𝐂𝐎𝐎𝐋𝐃𝐎𝐖𝐍: {cooldown}s

╰➤ ✨ 𝐂𝐑𝐄𝐃𝐈𝐓𝐒: {credits}
╰─────────────────➤
        `,
        "0": "Member",
        "1": "Group Admin",
        "2": "Bot Admin"
    },
    "vi_VN": {
        "help.list": "{list}\n\n⇒ Tổng cộng: {total} lệnh\n⇒ Sử dụng {syntax} [lệnh] để xem thêm thông tin về lệnh.",
        "help.commandNotExists": "Lệnh {command} không tồn tại.",
        "help.commandDetails": `
            ⇒ Tên: {name}
            ⇒ Tên khác: {aliases}
            ⇒ Phiên bản: {version}
            ⇒ Mô tả: {description}
            ⇒ Cách sử dụng: {usage}
            ⇒ Quyền hạn: {permissions}
            ⇒ Thể loại: {category}
            ⇒ Thời gian chờ: {cooldown}
            ⇒ Người viết: {credits}
        `,
        "0": "Thành viên",
        "1": "Quản trị nhóm",
        "2": "Quản trị bot"
    },
    "ar_SY": {
        "help.list": "{list}\n\n⇒ المجموع: {total} الاوامر\n⇒ يستخدم {syntax} [امر] لمزيد من المعلومات حول الأمر.",
        "help.commandNotExists": "امر {command} غير موجود.",
        "help.commandDetails": `
            ⇒ اسم: {name}
            ⇒ اسم مستعار: {aliases}
            ⇒ وصف: {description}
            ⇒ استعمال: {usage}
            ⇒ الصلاحيات: {permissions}
            ⇒ فئة: {category}
            ⇒ وقت الانتظار: {cooldown}
            ⇒ الاعتمادات: {credits}
        `,
        "0": "عضو",
        "1": "إدارة المجموعة",
        "2": "ادارة البوت"
    }
}

const catStyle = {
    admin: ["👑", "𝐀𝐃𝐌𝐈𝐍"],
    ai: ["🤖", "𝐀𝐈"],
    economy: ["💰", "𝐄𝐂𝐎𝐍𝐎𝐌𝐘"],
    general: ["📋", "𝐆𝐄𝐍𝐄𝐑𝐀𝐋"],
    group: ["👥", "𝐆𝐑𝐎𝐔𝐏"],
    media: ["🎬", "𝐌𝐄𝐃𝐈𝐀"],
    rika: ["✨", "𝐑𝐈𝐊𝐀"],
    tools: ["🛠️", "𝐓𝐎𝐎𝐋𝐒"]
};

function getCommandName(commandName) {
    if (global.plugins.commandsAliases.has(commandName)) return commandName;

    for (let [key, value] of global.plugins.commandsAliases) {
        if (value.includes(commandName)) return key;
    }

    return null
}

async function onCall({ message, args, getLang, userPermissions, prefix }) {
    const { commandsConfig } = global.plugins;
    const commandName = args[0]?.toLowerCase();

    if (!commandName) {
        let commands = {};
        const language = data?.thread?.data?.language || global.config.LANGUAGE || 'en_US';
        for (const [key, value] of commandsConfig.entries()) {
            if (!!value.isHidden) continue;
            if (!!value.isAbsolute ? !global.config?.ABSOLUTES.some(e => e == message.senderID) : false) continue;
            if (!value.hasOwnProperty("permissions")) value.permissions = [0, 1, 2];
            if (!value.permissions.some(p => userPermissions.includes(p))) continue;
            if (!commands.hasOwnProperty(value.category)) commands[value.category] = [];
            commands[value.category].push(value._name && value._name[language] ? value._name[language] : key);
        }

        let list = Object.keys(commands)
            .map(category => {
                const [emoji, name] = catStyle[category.toLowerCase()] || ["📌", category.toUpperCase()];
                return `╭─ ${emoji} ⌈ ${name} ⌋\n│ ${commands[category].join(", ")}\n╰─────────────────────➤`;
            })
            .join("\n\n");

        message.reply(getLang("help.list", {
            total: Object.values(commands).map(e => e.length).reduce((a, b) => a + b, 0),
            list,
            syntax: message.args[0].toLowerCase()
        }));
    } else {
        const command = commandsConfig.get(getCommandName(commandName, commandsConfig));
        if (!command) return message.reply(getLang("help.commandNotExists", { command: commandName }));

        const isHidden = !!command.isHidden;
        const isUserValid = !!command.isAbsolute ? global.config?.ABSOLUTES.some(e => e == message.senderID) : true;
        const isPermissionValid = command.permissions.some(p => userPermissions.includes(p));
        if (isHidden || !isUserValid || !isPermissionValid)
            return message.reply(getLang("help.commandNotExists", { command: commandName }));

        message.reply(getLang("help.commandDetails", {
            name: command.name,
            uname: command.name.toUpperCase(),
            aliases: command.aliases.join(", "),
            version: command.version || "1.0.0",
            description: command.description || '',
            usage: `${prefix}${commandName} ${command.usage || ''}`,
            permissions: command.permissions.map(p => getLang(String(p))).join(", "),
            category: command.category,
            cooldown: command.cooldown || 3,
            credits: command.credits || ""
        }).replace(/^ +/gm, ''));
    }
}

export default {
    config,
    langData,
    onCall
}
