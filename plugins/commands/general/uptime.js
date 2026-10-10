const config = {
    name: "uptime",
    aliases: ["upt"],
    credits: "XaviaTeam",
    rikaprefix: true
}

function onCall({ message }) {
    let uptime = global.msToHMS(process.uptime() * 1000);
    message.reply(`‎╭────────────❍\n╰➤ 🛸『 𝐔𝐏𝐓𝐈𝐌𝐄 』\n╰➤  ${uptime}\n╰─────────────────➤`);
}


export default {
    config,
    onCall
}
