const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ─── 1. HAPUS HEADER YANG BOCORKAN IDENTITAS SERVER ─────────────────────
app.disable('x-powered-by');

// ─── 2. RATE LIMITING (Anti-DDoS & Anti-Scraping) ───────────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 menit
    max: 150,                   // maks 150 request per IP per 15 menit
    message: { error: 'Terlalu banyak permintaan, coba lagi nanti.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});
app.use(generalLimiter);

// ─── 3. HELMET – SECURITY HEADERS KOMPREHENSIF ──────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://maps.googleapis.com",
                "https://maps.gstatic.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com",
                "data:"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https://maps.googleapis.com",
                "https://maps.gstatic.com",
                "https://*.google.com",
                "https://*.ggpht.com"
            ],
            frameSrc: [
                "https://maps.google.com",
                "https://www.google.com"
            ],
            frameAncestors: ["'none'"],   // ← ANTI-CLICKJACKING: larang di-embed di site lain
            connectSrc: ["'self'", "https://maps.googleapis.com"],
            objectSrc: ["'none'"],   // ← Larang plugin (Flash, dll)
            baseUri: ["'self'"],   // ← Cegah base-tag injection
            formAction: ["'self'"],   // ← Cegah form data dikirim ke luar
            workerSrc: ["'none'"],
            manifestSrc: ["'self'"],
            upgradeInsecureRequests: isProd ? [] : undefined
        }
    },
    // Anti-Clickjacking (backup dari frameAncestors CSP)
    frameguard: { action: 'deny' },

    // Paksa HTTPS (aktif di production)
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },

    // Cegah MIME sniffing
    noSniff: true,

    // XSS Filter lama (IE)
    xssFilter: true,

    // Matikan cache download
    dnsPrefetchControl: { allow: false },

    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' }
}));

// ─── 4. HEADER KEAMANAN TAMBAHAN ────────────────────────────────────────
app.use((req, res, next) => {
    // Anti-Clickjacking (triple protection)
    res.setHeader('X-Frame-Options', 'DENY');

    // Kendalikan informasi referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Matikan fitur browser berbahaya
    res.setHeader('Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()');

    // Cegah caching halaman sensitif
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    next();
});

// ─── 5. BLOKIR BOT SCRAPER UMUM ─────────────────────────────────────────
const blockedAgents = /scrapy|curl|wget|python-requests|go-http|java\/|libwww|jakarta/i;
app.use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    if (blockedAgents.test(ua)) {
        return res.status(403).json({ error: 'Akses ditolak.' });
    }
    next();
});

// ─── 6. SEMBUNYIKAN LISTING DIREKTORI ───────────────────────────────────
app.use(express.static(path.join(__dirname, 'src', 'public'), {
    maxAge: '7d',
    etag: true,
    index: false,           // ← Tidak tampilkan index direktori
    dotfiles: 'deny'        // ← Blokir akses file yang diawali titik (.env dll)
}));

// ─── 7. ROUTES ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// Blokir akses langsung ke path berbahaya
const blockedPaths = /\.(env|git|config|sql|db|log|bak|swp|json)$/i;
app.use((req, res, next) => {
    if (blockedPaths.test(req.path)) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// ─── 8. 404 HANDLER ─────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// ─── 9. ERROR HANDLER (Tidak bocorkan stack trace) ───────────────────────
app.use((err, req, res, next) => {
    // Hanya log di server, TIDAK tampilkan ke user
    console.error('❌ Internal Error:', isProd ? err.message : err.stack);
    res.status(500).send('Terjadi kesalahan pada server.');
});

// ─── 10. START SERVER ─────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT} [mode: ${isProd ? 'production' : 'development'}]`);
});
