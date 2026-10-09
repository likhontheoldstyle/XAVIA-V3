import axios from "axios";

const GEMINI_KEY = "AQ.Ab8RN6KVRSqDx1tqiUTCgBN4vPEpmFn3i2F6KSKAEBXMux4NIg";
const API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const config = {
  name: "gemini",
  aliases: ["ai", "chat"],
  version: "0.0.2",
  credits: "Rika",
  permissions: [0],
  cooldowns: 3,
  description: "Ask Gemini AI",
  usage: "[your question]",
  category: "ai",
  rikaprefix: true
};

async function askGemini(prompt) {
  const { data } = await axios.post(
    `${API}?key=${GEMINI_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { headers: { "Content-Type": "application/json" } }
  );
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error("No response from Gemini API.");
  return reply;
}

async function handleReply({ message }) {
  const p = message.body;
  if (!p) return;

  message.react("⏳");

  try {
    const reply = await askGemini(p);
    message.react("✅");

    message.reply(reply).then(d => {
      d.addReplyEvent({
        callback: handleReply,
        author: message.senderID
      });
    });
  } catch (e) {
    message.react("❌");
    message.reply("⚠ Gemini API er response dite somossa hocchhe.");
  }
}

async function onCall({ message, args }) {
  const p = args.join(" ");
  if (!p) return message.reply("❌ Please provide a question or prompt.");

  message.react("⏳");

  try {
    const reply = await askGemini(p);
    message.react("✅");

    message.reply(reply).then(d => {
      d.addReplyEvent({
        callback: handleReply,
        author: message.senderID
      });
    });
  } catch (e) {
    message.react("❌");
    message.reply("⚠ Gemini API theke response pawa jachchhe na.");
  }
}

export default {
  config,
  onCall
};
