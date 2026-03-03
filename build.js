const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const smp = require('html-minifier').minify;
const { minify: jsMinify } = require('terser');

const buildDir = path.join(__dirname, 'dist');
const srcDir = path.join(__dirname, 'src');

async function build() {
    console.log('🚀 Memulai proses build...');

    // 1. Bersihkan fold dist lama
    await fs.emptyDir(buildDir);
    console.log('✓ Folder /dist dibersihkan.');

    // 2. Buat struktur folder
    await fs.ensureDir(path.join(buildDir, 'public/css'));
    await fs.ensureDir(path.join(buildDir, 'public/js'));
    await fs.ensureDir(path.join(buildDir, 'public/img'));
    await fs.ensureDir(path.join(buildDir, 'views'));
    console.log('✓ Struktur folder /dist dibuat.');

    // 3. Minify HTML (index.html)
    const htmlPath = path.join(srcDir, 'views', 'index.html');
    let html = await fs.readFile(htmlPath, 'utf8');
    html = smp(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: true,
        minifyCSS: true
    });
    await fs.writeFile(path.join(buildDir, 'views', 'index.html'), html);
    console.log('✓ index.html di-minify.');

    // 4. Minify CSS (style.css)
    const cssPath = path.join(srcDir, 'public', 'css', 'style.css');
    const cssObj = await fs.readFile(cssPath, 'utf8');
    const cssRes = await postcss([autoprefixer, cssnano]).process(cssObj, { from: cssPath, to: path.join(buildDir, 'public/css/style.css') });
    await fs.writeFile(path.join(buildDir, 'public/css/style.css'), cssRes.css);
    console.log('✓ style.css di-minify dan auto-prefix.');

    // 5. Minify JS (main.js)
    const jsPath = path.join(srcDir, 'public', 'js', 'main.js');
    const jsObj = await fs.readFile(jsPath, 'utf8');
    const jsRes = await jsMinify(jsObj, { compress: true, mangle: true });
    await fs.writeFile(path.join(buildDir, 'public/js/main.js'), jsRes.code);
    console.log('✓ main.js di-minify.');

    // 6. Copy Images (img folder)
    await fs.copy(path.join(srcDir, 'public', 'img'), path.join(buildDir, 'public', 'img'));
    console.log('✓ Folder /img disalin ke dalam build.');

    // 7. Salin server.js & package.json menyesuaikan path
    const serverJsPath = path.join(__dirname, 'server.js');
    let serverCode = await fs.readFile(serverJsPath, 'utf8');
    serverCode = serverCode.replace(/'src'/g, "''");
    await fs.writeFile(path.join(buildDir, 'server.js'), serverCode);

    const pkgPath = path.join(__dirname, 'package.json');
    let pkgCode = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    delete pkgCode.devDependencies; // buang dev dep agar enteng di host
    await fs.writeFile(path.join(buildDir, 'package.json'), JSON.stringify(pkgCode, null, 2));

    console.log('🎉 Build Selesai! Aplikasi siap di-deploy dari folder /dist');
}

build().catch(console.error);
