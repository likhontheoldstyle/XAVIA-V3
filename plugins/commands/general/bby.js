import axios from "axios";

const apiUrl = "https://baby-apis-nix.vercel.app";
const rika = ["😚", "Yes 😀, I am here", "What's up?", "Bolo jaan ki korte pabor jonno"];
const ok = ["baby", "bby", "bot", "বেবি", "জান", "jan", "বট", "বেবী", "বাবু", "janu"];
const getRand = () => rika[Math.floor(Math.random() * nix.length)];

const config = {
    name: "bby",
    aliases: ["baby"],
    version: "0.0.1",
    credits: "ArYAN",
    cooldowns: 0,
    permissions: [0],
    description: "AI chat bot with learning",
    usage: "[msg] | teach [msg] - [reply] | remove [msg] | list",
    category: "chat",
    rikaprefix: true
};

async function handleReply({ message }) {
    const { senderID, threadID, messageID, body } = message;
    const p = body;
    if (!p) return;

    try {
        const r = await axios.get(`${apiUrl}/baby?text=${encodeURIComponent(p)}&senderID=${senderID}&font=1`);
        const aryan = r?.data?.reply;
        if (aryan) {
            const sentMsg = await message.reply(aryan);
            sentMsg.addReplyEvent({
                callback: handleReply,
                author: senderID
            });
        } else {
            message.reply("❌ | No response found. Please teach me!");
        }
    } catch {
        message.reply("❌ | Failed to fetch reply.");
    }
}

async function onCall({ message, args, data }) {
    const { Users } = global.controllers;
    const { senderID, threadID, messageID } = message;
    const txt = args.join(" ").trim();
    
    try {
        if (!txt) return message.reply(getRand());
        
        const isCommand = ["remove", "rm", "list", "edit", "teach"].includes(args[0]);
        
        if (isCommand) {
            if (args[0] === "remove") {
                const key = txt.slice(7).trim();
                const res = await axios.get(`${apiUrl}/baby-remove?key=${encodeURIComponent(key)}`);
                return message.reply(res.data.message || "Removed");
            }
            
            if (args[0] === "rm" && txt.includes("-")) {
                const parts = txt.slice(3).split(/\s*-\s*/).map(p => p.trim());
                const key = parts[0];
                const repOrIdx = parts[1];
                if (!key || repOrIdx === undefined) return message.reply("❌ | Use: rm [msg] - [reply/index]");
                const param = !isNaN(parseInt(repOrIdx)) && String(parseInt(repOrIdx)) === repOrIdx ? `index=${encodeURIComponent(repOrIdx)}` : `reply=${encodeURIComponent(repOrIdx)}`;
                const res = await axios.get(`${apiUrl}/baby-remove?key=${encodeURIComponent(key)}&${param}`);
                return message.reply(res.data.message || "Removed");
            }
            
            if (args[0] === "list") {
                if (args[1] === "all") {
                    const tRes = await axios.get(`${apiUrl}/teachers`);
                    const teachers = tRes.data.teachers || {};
                    const sorted = Object.keys(teachers).sort((a, b) => teachers[b] - teachers[a]);
                    const list = await Promise.all(sorted.map(async id => {
                        const name = await Users.getName(id).catch(() => id);
                        return `• ${name}: ${teachers[id]}`;
                    }));
                    return message.reply(`👑 | Teachers:\n${list.join("\n")}`);
                } else {
                    const infoRes = await axios.get(`${apiUrl}/baby-info`);
                    return message.reply(`❇️ | Total Teach = ${infoRes.data.totalKeys || "api off"}\n♻️ | Total Response = ${infoRes.data.totalReplies || "api off"}`);
                }
            }
            
            if (args[0] === "edit") {
                const parts = txt.split(/\s*-\s*/).map(p => p.trim());
                if (parts.length < 3) return message.reply("❌ | Use: edit [msg] - [oldReply] - [newReply]");
                const oldMsg = parts[0].replace("edit", "").trim();
                const oldReply = parts[1];
                const newReply = parts[2];
                if (!oldMsg || !oldReply || !newReply) return message.reply("❌ | Use: edit [msg] - [oldReply] - [newReply]");
                const res = await axios.get(`${apiUrl}/baby-edit?key=${encodeURIComponent(oldMsg)}&oldReply=${encodeURIComponent(oldReply)}&newReply=${encodeURIComponent(newReply)}&senderID=${senderID}`);
                return message.reply(res.data.message || "Edited");
            }
            
            if (args[0] === "teach" && args[1] === "react") {
                const parts = txt.split(/\s*-\s*/).map(p => p.trim());
                const final = parts[0].replace("teach react", "").trim();
                const cmd = parts[1];
                if (!cmd) return message.reply("❌ | Invalid format! Use: teach react [msg] - [react1, react2]");
                const res = await axios.get(`${apiUrl}/baby?teach=${encodeURIComponent(final)}&react=${encodeURIComponent(cmd)}`);
                return message.reply(res.data.message);
            }
            
            if (args[0] === "teach") {
                const parts = txt.split(/\s*-\s*/).map(p => p.trim());
                const final = parts[0].replace("teach", "").trim();
                const cmd = parts[1];
                if (!cmd) return message.reply("❌ | Invalid format! Use: teach [msg] - [reply1, reply2]");
                const res = await axios.get(`${apiUrl}/baby?teach=${encodeURIComponent(final)}&reply=${encodeURIComponent(cmd)}&senderID=${senderID}`);
                const teacher = await Users.getName(senderID).catch(() => senderID);
                if (res.data.addedReplies?.length === 0) {
                    const existingMsg = res.data.existingReplies.join(", ");
                    return message.reply(`❌ | All replies already exist for this question.\nExisting: ${existingMsg}`);
                }
                const teachsRes = await axios.get(`${apiUrl}/teachers`);
                const teachCount = teachsRes.data.teachers[senderID] || 0;
                const addedReplies = res.data.addedReplies?.join(", ") || cmd;
                return message.reply(`✅ | Replies "${addedReplies}" added to "${final}".\nTeacher: ${teacher}\nTeachs: ${teachCount}`);
            }
        }
        
        handleReply({ message });
    } catch {
        message.reply("❌ | Something went wrong.");
    }
}

export default {
    config,
    onCall
};
