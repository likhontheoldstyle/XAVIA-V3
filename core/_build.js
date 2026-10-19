
import "../cleanup.js";
import "dotenv/config";
import { writeFileSync, readFileSync } from "fs";
import { resolve as resolvePath } from "path";
import logger from "./var/modules/logger.js";
import login from "nijhum-fca";
import startServer from "./dashboard/server/app.js";
import startKeepAlive from "./var/modules/keepalive.js";
import handleListen from "./handlers/listen.js";
import environments from "./var/modules/environments.get.js";
import _init_var from "./var/_init.js";
import replitDB from "@replit/database";
import { execSync } from "child_process";
import {
    initDatabase,
    updateJSON,
    updateMONGO,
    _Threads,
    _Users,
} from "./handlers/database.js";
import crypto from "crypto";

const { isGlitch, isReplit } = environments;

process.stdout.write("]0;Xavia");

process.on("unhandledRejection", (reason, promise) => {
    console.error(reason, "Unhandled Rejection at Promise", promise);
});
process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception: " + err);
});
process.on("SIGINT", () => {
    logger.system(getLang("build.start.exit"));
    global.shutdown();
});
process.on("SIGTERM", () => {
    logger.system(getLang("build.start.exit"));
    global.shutdown();
});
process.on("SIGHUP", () => {
    logger.system(getLang("build.start.exit"));
    global.shutdown();
});

async function boot() {
    try {
        await _init_var();
        logger.system(getLang("build.start.varLoaded"));
        await initDatabase();
        global.updateJSON = updateJSON;
        global.updateMONGO = updateMONGO;
        global.controllers = { Threads: _Threads, Users: _Users };
        const adminPassword = getRandomPassword(8);
        startServer(adminPassword);
        startKeepAlive();
        process.env.SERVER_ADMIN_PASSWORD = adminPassword;
        await startLogin(logger);
    } catch (e) {
        logger.error(e);
        return global.shutdown();
    }
}

global.listenerID = null;

function startLogin(logger) {
    return new Promise((resolve, reject) => {
        logger.custom(getLang("build.booting.logging"), "LOGIN");
        doLogin().then(async (api) => {
            global.api = api;
            global.botID = api.getCurrentUserID();
            logger.custom(getLang("build.booting.logged", { botID }), "LOGIN");
            startRefreshState();
            if (global.config.REFRESH) scheduleRestart();
            const listenerID = generateListenerID();
            global.listenerID = listenerID;
            global.listenMqtt = api.listenMqtt(await handleListen(listenerID));
            startRefreshMqtt();
            resolve();
        }).catch((err) => {
            if (
                isGlitch &&
                global.isExists(
                    resolvePath(process.cwd(), ".data", "appstate.json"),
                    "file"
                )
            ) {
                global.deleteFile(
                    resolvePath(process.cwd(), ".data", "appstate.json")
                );
                execSync("refresh");
            }
            reject(err);
        });
    });
}

const STATE_REFRESH_MS = 1000 * 60 * 60 * 12;
const MQTT_REFRESH_MS = 1000 * 60 * 60 * 2;

function startRefreshState() {
    global.refreshState = setInterval(() => {
        logger.custom(getLang("build.refreshState"), "REFRESH");
        const appState = global.api.getAppState();
        if (global.config.APPSTATE_PROTECTION === true) {
            if (isGlitch) {
                writeFileSync(
                    resolvePath(process.cwd(), ".data", "appstate.json"),
                    JSON.stringify(appState, null, 2),
                    "utf-8"
                );
            } else if (isReplit) {
                const db = new replitDB();
                db.get("APPSTATE_SECRET_KEY")
                    .then((secretKey) => {
                        if (secretKey !== null) {
                            const encrypted = global.modules
                                .get("aes")
                                .encrypt(JSON.stringify(appState), secretKey);
                            writeFileSync(
                                resolvePath(global.config.APPSTATE_PATH),
                                JSON.stringify(encrypted),
                                "utf8"
                            );
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                    });
            }
        } else {
            writeFileSync(
                resolvePath(global.config.APPSTATE_PATH),
                JSON.stringify(appState, null, 2),
                "utf8"
            );
        }
    }, STATE_REFRESH_MS);
}

function startRefreshMqtt() {
    global.refreshMqtt = setInterval(async () => {
        logger.custom(getLang("build.refreshMqtt"), "REFRESH");
        const newListenerID = generateListenerID();
        global.listenMqtt.stopListening();
        global.listenerID = newListenerID;
        global.listenMqtt = global.api.listenMqtt(
            await handleListen(newListenerID)
        );
    }, MQTT_REFRESH_MS);
}

function generateListenerID() {
    return Date.now() + crypto.randomBytes(4).toString("hex");
}

function scheduleRestart() {
    setTimeout(() => global.restart(), global.config.REFRESH);
}

function doLogin() {
    const { APPSTATE_PATH, APPSTATE_PROTECTION, LOGIN } = global.config;
    return new Promise((resolve, reject) => {
        if (LOGIN === true) {
            const loginFile = resolvePath(process.cwd(), "config", "login.main.json");
            if (!global.isExists(loginFile, "file")) {
                return reject(
                    new Error(
                        "login.main.json not found. Please create it with email and password."
                    )
                );
            }
            const creds = JSON.parse(readFileSync(loginFile, "utf8"));
            if (!creds.email || !creds.password) {
                return reject(
                    new Error("Email or password not found in login.main.json")
                );
            }
            const fcaOptions = global.config.FCA_OPTIONS;
            login(
                { email: creds.email, password: creds.password },
                fcaOptions,
                (err, api) => {
                    if (err) return reject(err.error || err);
                    resolve(api);
                }
            );
        } else {
            global.modules
                .get("checkAppstate")(APPSTATE_PATH, APPSTATE_PROTECTION)
                .then((appState) => {
                    const fcaOptions = global.config.FCA_OPTIONS;
                    login({ appState }, fcaOptions, (err, api) => {
                        if (err) return reject(err.error || err);
                        resolve(api);
                    });
                })
                .catch((e) => reject(e));
        }
    });
}

boot();
