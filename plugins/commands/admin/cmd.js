import axios from "axios";
import { writeFileSync } from "fs";
import { resolve as resolvePath } from "path";
import { pathToFileURL } from "url";

const config = {
    name: "cmd",
    aliases: [],
    version: "0.0.1",
    credits: "ArYAN",
    permissions: [2],
    cooldowns: 5,
    description: "Manage command files - load, unload, install commands",
    usage: "load <name> | loadall | unload <name> | install <url> <filename>",
    category: "admin",
    rikaprefix: false
};

const langData = {
    en_US: {
        missingFileName: "⚠️ Please enter the command name you want to reload",
        loaded: "✅ Loaded command \"{name}\" successfully",
        loadedError: "❌ Failed to load command \"{name}\" with error:\n{error}",
        loadedSuccess: "✅ Loaded successfully ({count}) commands",
        loadedFail: "❌ Failed to load ({count}) commands",
        unloaded: "✅ Unloaded command \"{name}\" successfully",
        unloadedError: "❌ Failed to unload command \"{name}\"",
        missingUrl: "⚠️ Please enter URL and filename",
        invalidUrl: "⚠️ Please enter a valid URL",
        installed: "✅ Installed command \"{name}\" successfully at {path}",
        installedError: "❌ Failed to install command \"{name}\" with error:\n{error}",
        missingFileName: "⚠️ Please enter filename to save command (.js)",
        alreadyExist: "⚠️ Command file already exists. React to overwrite.",
        downloaded: "✅ Downloaded and saved command file"
    }
};

async function loadSingleCommand(commandPath, commandName) {
    try {
        const pluginURL = pathToFileURL(commandPath);
        pluginURL.searchParams.set("version", Number(Date.now()));
        
        let pluginExport = await import(pluginURL);
        pluginExport = pluginExport.default || pluginExport;
        
        const { config, langData, onCall } = pluginExport;
        
        if (!config || !config.name) {
            throw new Error("Invalid command format - missing config");
        }
        
        if (global.plugins.commands.has(config.name)) {
            global.plugins.commands.delete(config.name);
            global.plugins.commandsConfig.delete(config.name);
            
            const oldAliases = global.plugins.commandsAliases.get(config.name);
            if (oldAliases) {
                global.plugins.commandsAliases.delete(config.name);
            }
        }
        
        global.plugins.commands.set(config.name, onCall);
        global.plugins.commandsConfig.set(config.name, config);
        
        if (config.aliases && Array.isArray(config.aliases)) {
            global.plugins.commandsAliases.set(config.name, config.aliases);
        }
        
        if (langData) {
            for (const langKey in langData) {
                if (!global.data.langPlugin[langKey]) {
                    global.data.langPlugin[langKey] = {};
                }
                global.data.langPlugin[langKey][config.name] = langData[langKey];
            }
        }
        
        return { success: true, name: config.name };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function onCall({ message, args, getLang }) {
    const { threadID, senderID, messageID } = message;
    
    try {
        const query = args[0]?.toLowerCase();
        
        if (query === "load" && args[1]) {
            const commandName = args[1].toLowerCase().replace(".js", "");
            const commandsPath = resolvePath(global.pluginsPath, "commands");
            
            let foundPath = null;
            const categories = require("fs").readdirSync(commandsPath);
            
            for (const category of categories) {
                const categoryPath = resolvePath(commandsPath, category);
                const stat = require("fs").statSync(categoryPath);
                if (!stat.isDirectory()) continue;
                
                const possiblePath = resolvePath(categoryPath, `${commandName}.js`);
                if (global.isExists(possiblePath, "file")) {
                    foundPath = possiblePath;
                    break;
                }
            }
            
            if (!foundPath) {
                return message.reply(getLang("loadedError", { name: commandName, error: "File not found" }));
            }
            
            const result = await loadSingleCommand(foundPath, commandName);
            
            if (result.success) {
                return message.reply(getLang("loaded", { name: result.name }));
            } else {
                return message.reply(getLang("loadedError", { name: commandName, error: result.error }));
            }
        }
        
        else if (query === "loadall") {
            delete global.plugins;
            global.plugins = new Object({
                commands: new Map(),
                commandsAliases: new Map(),
                commandsConfig: new Map(),
                customs: new Number(0),
                events: new Map(),
                onMessage: new Map()
            });
            
            for (const lang in global.data.langPlugin) {
                for (const plugin in global.data.langPlugin[lang]) {
                    if (plugin == config.name) continue;
                    delete global.data.langPlugin[lang][plugin];
                }
            }
            
            await global.modules.get("loader").loadPlugins();
            return message.reply(getLang("loadedSuccess", { count: global.plugins.commands.size }));
        }
        
        else if (query === "unload" && args[1]) {
            const commandName = args[1].toLowerCase();
            
            if (global.plugins.commands.has(commandName)) {
                global.plugins.commands.delete(commandName);
                global.plugins.commandsConfig.delete(commandName);
                
                const aliases = global.plugins.commandsAliases.get(commandName);
                if (aliases) {
                    global.plugins.commandsAliases.delete(commandName);
                }
                
                return message.reply(getLang("unloaded", { name: commandName }));
            } else {
                return message.reply(getLang("unloadedError", { name: commandName }));
            }
        }
        
        else if (query === "install") {
            let url = args[1];
            let fileName = args[2];
            
            if (!url || !fileName) {
                return message.reply(getLang("missingUrl"));
            }
            
            if (!fileName.endsWith(".js")) {
                fileName = fileName + ".js";
            }
            
            if (url.includes("github.com") && url.includes("/blob/")) {
                url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
            }
            
            if (url.includes("pastebin.com") && !url.includes("/raw/")) {
                url = url.replace("pastebin.com/", "pastebin.com/raw/");
            }
            
            try {
                const response = await axios.get(url);
                const code = response.data;
                
                const savePath = resolvePath(global.pluginsPath, "commands", "new", fileName);
                writeFileSync(savePath, code, "utf8");
                
                const result = await loadSingleCommand(savePath, fileName.replace(".js", ""));
                
                if (result.success) {
                    return message.reply(getLang("installed", { name: result.name, path: savePath.replace(global.mainPath, "") }));
                } else {
                    return message.reply(getLang("installedError", { name: fileName, error: result.error }));
                }
            } catch (err) {
                return message.reply(getLang("installedError", { name: fileName, error: err.message || err }));
            }
        }
        
        else {
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
