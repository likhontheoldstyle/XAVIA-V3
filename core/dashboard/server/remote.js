import path from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const BLOCKED = ['appstate.json', 'config/login.main.json'];

function safePath(rel) {
    if (!rel || typeof rel !== 'string') return null;
    const root = process.cwd();
    const abs = path.resolve(root, rel);
    if (abs !== root && !abs.startsWith(root + path.sep)) return null;
    const normalized = path.relative(root, abs).split(path.sep).join('/');
    if (BLOCKED.includes(normalized)) return null;
    return { abs, normalized };
}

export default function registerRemote(app) {
    app.use('/remote', (req, res, next) => {
        const key = global.config && global.config.REMOTE_ACCESS_KEY;
        if (!key) return res.status(404).send('Not Found');
        if (req.headers['xva-remote-key'] !== key) return res.status(401).send('Unauthorized');
        next();
    });

    app.get('/remote/ping', (req, res) => {
        let version = null;
        try {
            version = JSON.parse(readFileSync(path.resolve('package.json'))).version;
        } catch (e) { }
        res.json({ ok: true, uptime: Math.floor(process.uptime()), version });
    });

    app.get('/remote/read', (req, res) => {
        const target = safePath(req.query.path);
        if (!target) return res.status(400).json({ ok: false, error: 'bad_path' });
        if (!existsSync(target.abs)) return res.status(404).json({ ok: false, error: 'not_found' });
        try {
            const content = readFileSync(target.abs, 'utf8');
            res.json({ ok: true, path: target.normalized, content });
        } catch (e) {
            res.status(500).json({ ok: false, error: String(e && e.message || e) });
        }
    });

    app.post('/remote/update', (req, res) => {
        const body = req.body || {};
        const files = body.files || {};
        const names = Object.keys(files);
        if (!names.length) return res.status(400).json({ ok: false, error: 'no_files' });
        const results = [];
        for (const name of names) {
            const target = safePath(name);
            if (!target) {
                results.push({ path: name, ok: false, error: 'blocked_or_bad_path' });
                continue;
            }
            try {
                mkdirSync(path.dirname(target.abs), { recursive: true });
                writeFileSync(target.abs, String(files[name]), 'utf8');
                results.push({ path: target.normalized, ok: true });
            } catch (e) {
                results.push({ path: name, ok: false, error: String(e && e.message || e) });
            }
        }
        const failed = results.filter(r => !r.ok).length;
        res.json({ ok: failed === 0, results });
        if (body.restart && failed === 0) {
            setTimeout(() => global.restart(), 800);
        }
    });

    app.post('/remote/restart', (req, res) => {
        res.json({ ok: true, message: 'Restarting' });
        setTimeout(() => global.restart(), 800);
    });
}
