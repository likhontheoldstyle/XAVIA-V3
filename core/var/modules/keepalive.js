import axios from "axios";

const PING_INTERVAL = 2 * 60 * 1000;

export default function startKeepAlive() {
    const base = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 25605}`;
    const url = `${base.replace(/\/$/, "")}/health`;

    async function ping() {
        try {
            await axios.get(url, { timeout: 30000 });
            console.log(`\x1b[32m[KEEPALIVE]\x1b[0m ping ok (${url})`);
        } catch (e) {
            console.log(`\x1b[33m[KEEPALIVE]\x1b[0m ping failed: ${e.message}`);
        }
    }

    ping();
    setInterval(ping, PING_INTERVAL);
    console.log(`\x1b[32m[KEEPALIVE]\x1b[0m self-ping every 2m -> ${url}`);
}
