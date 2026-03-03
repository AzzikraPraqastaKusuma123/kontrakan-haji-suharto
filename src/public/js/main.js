document.addEventListener('DOMContentLoaded', () => {
    const loaderFill = document.getElementById('loaderFill');
    const loader = document.getElementById('loader');

    let loadProgress = 0;
    const int = setInterval(() => {
        loadProgress += Math.random() * 15;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(int);
            loaderFill.style.width = '100%';
            setTimeout(() => {
                loader.classList.add('hide');
                document.querySelector('.hero-body').classList.add('active');
                initHero();
            }, 600);
        } else {
            loaderFill.style.width = loadProgress + '%';
        }
    }, 100);
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursorDot');

    if (window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            if (cursor && cursorDot) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
                cursorDot.style.left = e.clientX + 'px';
                cursorDot.style.top = e.clientY + 'px';
            }
        });
        const darkSections = [document.querySelector('.fasilitas'), document.querySelector('.hero'), document.querySelector('.kontak'), document.querySelector('.footer')];

        document.addEventListener('mousemove', (e) => {
            let isDark = false;
            darkSections.forEach(sec => {
                if (!sec) return;
                const rect = sec.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    isDark = true;
                }
            });
            if (cursor && cursorDot) {
                if (isDark) {
                    cursor.classList.add('dark');
                    cursorDot.classList.add('dark');
                } else {
                    cursor.classList.remove('dark');
                    cursorDot.classList.remove('dark');
                }
            }
        });

        const hoverables = document.querySelectorAll('a, button, .gm-item');
        hoverables.forEach(link => {
            link.addEventListener('mouseenter', () => {
                cursor && cursor.classList.add('hovered');
                cursorDot && cursorDot.classList.add('hovered');
            });
            link.addEventListener('mouseleave', () => {
                cursor && cursor.classList.remove('hovered');
                cursorDot && cursorDot.classList.remove('hovered');
            });
        });
    }
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const curScroll = window.scrollY;
        if (curScroll > 150 && curScroll > lastScroll && !document.getElementById('navMenu').classList.contains('open')) {
            nav.classList.add('hide');
        } else {
            nav.classList.remove('hide');
        }
        lastScroll = curScroll;
    });

    const navBurger = document.getElementById('navBurger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nm-link');

    navBurger.addEventListener('click', () => {
        navBurger.classList.toggle('open');
        navMenu.classList.toggle('open');
        if (navMenu.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
            nav.style.mixBlendMode = 'normal';
        } else {
            document.body.style.overflow = '';
            setTimeout(() => nav.style.mixBlendMode = 'difference', 800);
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navBurger.classList.remove('open');
            navMenu.classList.remove('open');
            document.body.style.overflow = '';
            setTimeout(() => nav.style.mixBlendMode = 'difference', 800);
        });
    });
    const slides = document.querySelectorAll('.hb-slide');
    const slideNum = document.getElementById('slideNum');
    let curSlide = 0;

    function initHero() {
        setInterval(() => {
            slides[curSlide].classList.remove('active');
            curSlide = (curSlide + 1) % slides.length;
            slides[curSlide].classList.add('active');
            slideNum.textContent = '0' + (curSlide + 1);
        }, 6000);
    }
    const reveals = document.querySelectorAll('.reveal');
    const counters = document.querySelectorAll('.si-num');
    let counted = false;

    const obsOptions = { root: null, rootMargin: '0px', threshold: 0.15 };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.classList.contains('lok-info') && !counted) {
                }

                observer.unobserve(entry.target);
            }
        });
    }, obsOptions);

    reveals.forEach(el => observer.observe(el));
    const strip = document.querySelector('.strip');
    const stripObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !counted) {
            counted = true;
            counters.forEach(c => {
                if (!c.dataset.target) return;
                const target = +c.dataset.target;
                let p = 0;
                const stp = target / 40;
                const t = setInterval(() => {
                    p += stp;
                    if (p >= target) { c.textContent = target; clearInterval(t); }
                    else c.textContent = Math.floor(p);
                }, 30);
            });
            stripObs.disconnect();
        }
    }, { threshold: 0.5 });
    if (strip) stripObs.observe(strip);
});

function openLB(src, cap) {
    document.getElementById('lbImg').src = src;
    document.getElementById('lbCap').textContent = cap;
    document.getElementById('lb').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLB() {
    document.getElementById('lb').classList.remove('active');
    document.body.style.overflow = '';
}