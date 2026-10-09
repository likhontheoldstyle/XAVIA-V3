async function onCall({ message }) {
    const { threadID, body, isGroup } = message;
    const { Threads } = global.controllers;
    
    if (!body || body.toLowerCase() !== "prefix") return;
    
    const _thread = isGroup === true ? (await Threads.get(threadID)) || {} : {};
    const systemPrefix = global.config.PREFIX || "!";
    const threadPrefix = _thread?.data?.prefix || systemPrefix;
    
    message.reply(`╭────────────❍\n╰➤ 🛸 𝐁𝐎𝐗 𝐏𝐫𝐞𝐟𝐢𝐱 : 『 ${threadPrefix} 』\n\n╭────────────❍\n╰➤ 🌐 ‎𝐒𝐘𝐒 𝐏𝐫𝐞𝐟𝐢𝐱 : 『 ${systemPrefix} 』`);
}

export default {
    onCall
};
