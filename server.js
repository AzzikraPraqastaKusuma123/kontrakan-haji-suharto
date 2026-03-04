const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// 1. Hapus header identitas server
app.disable('x-powered-by');

// 2. Rate limiting – anti DDoS dan scraping
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { error: 'Terlalu banyak permintaan, coba lagi nanti.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(generalLimiter);

// 3. Helmet security headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://maps.googleapis.com", "https://maps.gstatic.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
                fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "data:"],
                imgSrc: ["'self'", "data:", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://*.google.com", "https://*.ggpht.com"],
                frameSrc: ["https://maps.google.com", "https://www.google.com"],
                frameAncestors: ["'none'"],
                connectSrc: ["'self'", "https://maps.googleapis.com"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"]
            }
        },
        frameguard: { action: 'deny' },
        noSniff: true,
        xssFilter: true,
        dnsPrefetchControl: { allow: false },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginResourcePolicy: { policy: 'same-site' },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    })
);

// 4. Header tambahan manual
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    next();
});

// 5. Blokir bot scraper umum berdasarkan User-Agent
const blockedAgents = /scrapy|curl|wget|python-requests|go-http|libwww|jakarta/i;
app.use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    if (blockedAgents.test(ua)) {
        return res.status(403).json({ error: 'Akses ditolak.' });
    }
    next();
});

// 6. Static files (tanpa directory listing, tanpa akses dotfiles)
app.use(express.static(path.join(__dirname, 'src', 'public'), {
    maxAge: '7d',
    etag: true,
    index: false,
    dotfiles: 'deny'
}));

// 7. Blokir akses path sensitif
app.use((req, res, next) => {
    if (/\.(env|git|config|sql|db|log|bak|swp)$/i.test(req.path)) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// 8. Route utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// 9. 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// 10. Error handler – tidak bocorkan stack trace ke user
app.use((err, req, res, next) => {
    console.error('Server Error:', isProd ? err.message : err.stack);
    res.status(500).send('Terjadi kesalahan pada server.');
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
