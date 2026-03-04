const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SECURITY HEADERS ───────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com"
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
                "https://fonts.gstatic.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https://maps.googleapis.com",
                "https://maps.gstatic.com",
                "https://*.google.com"
            ],
            frameSrc: [
                "https://maps.google.com",
                "https://www.google.com"
            ],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Tambahan header manual untuk keamanan ekstra
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// ─── STATIC FILES ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src', 'public'), {
    maxAge: '7d',
    etag: true
}));

// ─── ROUTES ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// 404 handler – catch-all
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// ─── ERROR HANDLER ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).send('Internal Server Error');
});

// ─── START SERVER ────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
