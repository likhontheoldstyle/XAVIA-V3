import axios from "axios";

const config = {
  name: "tikstalk",
  aliases: ["tiktokstalk", "tinfo"],
  version: "0.0.1",
  credits: "ArYAN",
  permissions: [0],
  cooldowns: 5,
  description: "Get full TikTok profile info - stalk a TikTok profile",
  usage: "<username>",
  category: "nix"
};

async function onCall({ message, args }) {
  const username = args[0];
  if (!username) {
    return message.reply("⚠️ Please provide a TikTok username.");
  }

  message.react("⏳");

  try {
    const response = await axios.get(`http://65.109.80.126:20409/aryan/tikstalk`, { params: { username } });
    const data = response.data;

    if (!data || !data.status) {
      message.react("❌");
      return message.reply("⚠️ User not found or API error.");
    }

    const messageText = `
📛 Username: ${data.username}
👤 Nickname: ${data.nickname}
📝 Bio: ${data.signature || 'N/A'}
🏷 ID: ${data.id}
👥 Followers: ${data.followerCount}
📤 Following: ${data.followingCount}
🎥 Videos: ${data.videoCount}
❤️ Hearts: ${data.heartCount}
    `;

    message.react("✅");

    const imageStream = (await axios.get(data.avatarLarger, { responseType: "stream" })).data;

    message.reply({
      body: messageText,
      attachment: imageStream
    });
  } catch (err) {
    console.error(err);
    message.react("❌");
    message.reply("❌ Invalid username or API error. Please try again later.");
  }
}

export default {
  config,
  onCall
};
