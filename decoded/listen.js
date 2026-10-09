// CLEAN REWRITE of core/handlers/listen.js
// Manually reverse-engineered: control-flow flattened + identifiers renamed by hand.
// Behavior is identical to the original obfuscated file.

import moment from "moment-timezone";
import handleEvents from "./events.js";
import { handleDatabase } from "./database.js";
import logger from "../var/modules/logger.js";

export default async function createListener(listenerID) {
    const {
        handleCommand,
        handleReaction,
        handleMessage,
        handleReply,
        handleUnsend,
        handleEvent,
    } = await handleEvents();

    const ignoredTypes = ["typ", "presence", "read_receipt"];
    const log = global.modules.get("logger");

    function logEvent(event) {
        const { LOG_LEVEL, timezone } = global.config;
        if (LOG_LEVEL == 0) return;
        if (ignoredTypes.includes(event.type)) return;

        const { type, threadID, body, senderID } = event;

        if (LOG_LEVEL == 1) {
            if (type == "message" || type == "message_reply") {
                const ts = moment().tz(timezone).format("YYYY-MM-DD_HH:mm:ss");
                log.custom(
                    `${threadID} • ${senderID} • ${body ? body : "Photo, video, sticker, etc."}`,
                    `${ts}`
                );
            }
        } else if (LOG_LEVEL == 2) {
            console.log(event);
        }
    }

    return (err, event) => {
        if (global.listenerID != listenerID) return;

        if (!event) {
            log.error(getLang("handlers.listen.accountError"));
            process.exit(0);
        }

        if (
            global.maintain &&
            !global.config.MODERATORS.some(
                (id) => id == event.senderID || id == event.userID
            )
        )
            return;

        logEvent(event);

        if (global.config.ALLOW_INBOX !== true && event.isGroup === false)
            return;

        if (
            global.config.FCA_OPTIONS?.selfListen === false &&
            event.senderID === global.botID
        )
            return;

        (async () => {
            if (!ignoredTypes.includes(event.type)) {
                await handleDatabase({ ...event });
            }

            switch (event.type) {
                case "message":
                case "message_reply":
                    handleMessage({ ...event });
                    handleReply({ ...event });
                    handleCommand({ ...event });
                    break;
                case "message_reaction":
                    handleReaction({ ...event });
                    break;
                case "message_unsend":
                    handleUnsend({ ...event });
                    break;
                case "event":
                case "change_thread_image":
                    handleEvent({ ...event });
                    break;
                case "typ":
                case "presence":
                case "read_receipt":
                default:
                    break;
            }
        })();
    };
}
