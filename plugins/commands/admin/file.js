import { join } from "path";
import { readdirSync } from "fs";

const config = {
    name: "file",
    description: "Send a bot plugin file in chat",
    usage: "<filename>",
    cooldown: 5,
    permissions: [2],
    credits: "Rika",
};

const langData = {
    en_US: {
        missingName: "Please provide a file name. Usage: /file <filename>",
        notFound: "File \"{name}\" not found in plugins.",
        error: "An error occurred. Please try again later.",
    },
    vi_VN: {
        missingName: "Vui lòng cung cấp tên file. Cách dùng: /file <filename>",
        notFound: "Không tìm thấy file \"{name}\" trong plugins.",
        error: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
    },
    ar_SY: {
        missingName: "يرجى تقديم اسم الملف. الاستخدام: /file <filename>",
        notFound: "لم يتم العثور على الملف \"{name}\" في plugins.",
        error: "حدث خطأ. حاول لاحقًا.",
    },
};

function findFile(name, dir) {
    const lower = name.toLowerCase();
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (e.name === "node_modules") continue;
        const p = join(dir, e.name);
        if (e.isDirectory()) {
            const found = findFile(name, p);
            if (found) return found;
        } else if (
            e.name.toLowerCase() === lower ||
            e.name.toLowerCase() === lower + ".js"
        ) {
            return p;
        }
    }
    return null;
}

async function onCall({ message, args, getLang }) {
    const { reply } = message;
    const name = args[0];
    if (!name) return reply(getLang("missingName"));
    try {
        const found = findFile(name, join(global.mainPath, "plugins"));
        if (!found) return reply(getLang("notFound", { name }));
        const stream = await getStream(found);
        await reply({ attachment: stream });
    } catch (e) {
        console.error(e);
        reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
