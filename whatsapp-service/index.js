const express = require('express');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
} = require('@whiskeysockets/baileys');

const app = express();
app.use(express.json());

let sock = null;

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.update', (updates) => {
        for (const u of updates) {
            console.log('message status update:', JSON.stringify({ key: u.key, update: u.update }));
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Scan QR code ini pakai WhatsApp kamu:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, reconnect:', shouldReconnect);
            if (shouldReconnect) startSock();
        } else if (connection === 'open') {
            console.log('WhatsApp berhasil terhubung!');
        }
    });
}

startSock();

app.post('/send', async (req, res) => {
    const { number, message } = req.body;

    if (!sock) {
        return res.status(503).json({ success: false, error: 'WhatsApp belum terhubung' });
    }

    try {
        const jid = `${number}@s.whatsapp.net`;
        const result = await sock.sendMessage(jid, { text: message });
        console.log('sendMessage result:', JSON.stringify(result));
        res.json({ success: true, result });
    } catch (error) {
        console.log('sendMessage error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/whoami', (req, res) => {
    if (!sock) {
        return res.status(503).json({ success: false, error: 'WhatsApp belum terhubung' });
    }
    res.json({ success: true, user: sock.user || null });
});

app.get('/check/:number', async (req, res) => {
    if (!sock) {
        return res.status(503).json({ success: false, error: 'WhatsApp belum terhubung' });
    }

    try {
        const [result] = await sock.onWhatsApp(req.params.number);
        console.log('onWhatsApp result:', JSON.stringify(result));
        res.json({ success: true, result: result || null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`WhatsApp service jalan di port ${PORT}`));