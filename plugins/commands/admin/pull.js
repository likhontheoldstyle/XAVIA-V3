import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const config = {
  name: "pull",
  aliases: ["update", "gitpull"],
  version: "1.0.0",
  credits: "Rika",
  permissions: [2],
  cooldowns: 10,
  description: "Pull latest commit from GitHub and restart bot",
  usage: "/pull",
  category: "admin"
};

async function onCall({ message }) {
  await message.reply("📥 GitHub theke latest update anchi...");

  try {
    const { stdout: pullOut, stderr: pullErr } = await execAsync("git pull origin main", { timeout: 60000 });
    const output = (pullOut + pullErr).trim();

    if (/already up to date/i.test(output)) {
      return message.reply("✅ Bot already up-to-date. Kono notun commit nai.");
    }

    const shortLog = output.split("\n").slice(0, 10).join("\n");
    await message.reply(`✅ Update peyechi:\n\n${shortLog}\n\n🔄 Restart hocche...`);

    setTimeout(() => global.restart(), 2000);
  } catch (e) {
    return message.reply(`❌ Pull failed:\n${(e.message || e).toString().slice(0, 500)}`);
  }
}

export default { config, onCall };
