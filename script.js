/* ============================================================
   FLUXR.IN — Hero Interactions
   Custom Cursor · Mouse Parallax · Magnetic Buttons
   Particle Canvas · Glass Hover · Entrance Animations
   ============================================================ */

(function () {
    'use strict';

    /* ── Detect touch / reduced-motion ─────────────────────── */
    const isTouchDevice = () =>
        window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Lerp helper ─────────────────────────────────────────── */
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ── RAF loop ────────────────────────────────────────────── */
    let rafId = null;
    const startRaf = (fn) => {
        const loop = () => { fn(); rafId = requestAnimationFrame(loop); };
        rafId = requestAnimationFrame(loop);
    };

    /* ================================================================
       1. PAGE LOAD ENTRANCE ANIMATIONS
    ================================================================ */
    function runEntranceAnimations() {
        const video     = document.getElementById('hero-video');
        const nav       = document.getElementById('glassNav');
        const eyebrow   = document.getElementById('eyebrow');
        const heading   = document.getElementById('heroHeading');
        const desc      = document.getElementById('heroDesc');
        const ctas      = document.getElementById('heroCtas');
        const floatGlobe= document.getElementById('floatCardGlobe');
        const floatSvc  = document.getElementById('floatServices');
        const scrollInd = document.getElementById('scrollIndicator');
        const orbital   = document.getElementById('orbitalSvg');

        const addLoaded = (el, delay = 0) => {
            if (!el) return;
            if (delay) {
                setTimeout(() => el.classList.add('loaded'), delay);
            } else {
                el.classList.add('loaded');
            }
        };

        /* Video: mark loaded once metadata available */
        if (video) {
            if (video.readyState >= 1) {
                video.classList.add('loaded');
            } else {
                video.addEventListener('loadedmetadata', () =>
                    video.classList.add('loaded'), { once: true });
            }
        }

        /* Staggered entrance sequence */
        addLoaded(nav,        80);   /* nav fades/slides in */
        addLoaded(eyebrow,    480);

        /* Heading lines — each gets .loaded, CSS transition-delay does staggering */
        const lines = heading ? heading.querySelectorAll('.heading-line') : [];
        lines.forEach(line => addLoaded(line, 640));

        addLoaded(desc,       1220);
        addLoaded(ctas,       1380);
        addLoaded(floatGlobe, 1780);
        addLoaded(floatSvc,   1940);
        addLoaded(scrollInd,  2160);
        addLoaded(orbital,    780);
    }

    /* ================================================================
       2. CUSTOM CURSOR
    ================================================================ */
    function initCursor() {
        if (isTouchDevice()) return;

        const dot  = document.getElementById('cursorDot');
        const glow = document.getElementById('cursorGlow');
        if (!dot || !glow) return;

        let mx = window.innerWidth / 2,  my = window.innerHeight / 2;
        let dx = mx, dy = my;   // dot (direct)
        let gx = mx, gy = my;   // glow (lerped)

        document.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
        });

        startRaf(() => {
            /* dot follows directly */
            dx = lerp(dx, mx, 0.72);
            dy = lerp(dy, my, 0.72);
            dot.style.transform = `translate3d(calc(${dx}px - 50%), calc(${dy}px - 50%), 0)`;

            /* glow trails softly */
            gx = lerp(gx, mx, 0.08);
            gy = lerp(gy, my, 0.08);
            glow.style.transform = `translate3d(calc(${gx}px - 50%), calc(${gy}px - 50%), 0)`;
        });

        /* Hide cursor when leaving window */
        document.addEventListener('mouseleave', () => {
            dot.style.opacity  = '0';
            glow.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            dot.style.opacity  = '1';
            glow.style.opacity = '1';
        });
    }

    /* ================================================================
       2.5. PROJECT CUSTOM CURSOR
    ================================================================ */
    function initProjectCursor() {
        if (isTouchDevice()) return;

        const viewProjectCursor = document.getElementById('cursorViewProject');
        const projectCards = document.querySelectorAll('.project-card');
        if (!viewProjectCursor) return;

        let mx = window.innerWidth / 2, my = window.innerHeight / 2;
        let cx = mx, cy = my;

        document.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
        });

        startRaf(() => {
            cx = lerp(cx, mx, 0.15);
            cy = lerp(cy, my, 0.15);
            viewProjectCursor.style.left = cx + 'px';
            viewProjectCursor.style.top = cy + 'px';
        });

        projectCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                viewProjectCursor.classList.add('active');
                const dot = document.getElementById('cursorDot');
                const glow = document.getElementById('cursorGlow');
                if (dot) dot.style.opacity = '0';
                if (glow) glow.style.opacity = '0';
            });
            card.addEventListener('mouseleave', () => {
                viewProjectCursor.classList.remove('active');
                const dot = document.getElementById('cursorDot');
                const glow = document.getElementById('cursorGlow');
                if (dot) dot.style.opacity = '1';
                if (glow) glow.style.opacity = '1';
            });
        });
    }

    /* ================================================================
       3. MOUSE-REACTIVE HERO PARALLAX
    ================================================================ */
    function initParallax() {
        if (isTouchDevice() || prefersReducedMotion()) return;

        const hero      = document.getElementById('hero');
        const video     = document.getElementById('hero-video');
        const glowGlobe = document.getElementById('heroGlowGlobe');
        const orbital   = document.getElementById('orbitalSvg');
        const content   = document.getElementById('heroContent');
        const floatCard = document.getElementById('floatCardGlobe');
        const glowLeft  = hero ? hero.querySelector('.hero-glow-left') : null;

        if (!hero) return;

        let tx = 0, ty = 0;
        let vx = 0, vy = 0;   // current video offset
        let cx = 0, cy = 0;   // current content offset
        let fx = 0, fy = 0;   // current float card offset

        const W = () => window.innerWidth;
        const H = () => window.innerHeight;

        hero.addEventListener('mousemove', e => {
            /* Normalise to -1 … +1 relative to center */
            tx = (e.clientX / W() - 0.5) * 2;
            ty = (e.clientY / H() - 0.5) * 2;
        });

        hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

        startRaf(() => {
            /* Globe / video — moves opposite to cursor (parallax) */
            vx = lerp(vx, -tx * 8, 0.06);
            vy = lerp(vy, -ty * 6, 0.06);
            if (video) {
                video.style.transform =
                    `translateY(-50%) translate3d(${vx}px, ${vy}px, 0)`;
            }
            if (orbital) {
                orbital.style.transform =
                    `translateY(-50%) translate3d(${vx * 0.8}px, ${vy * 0.8}px, 0)`;
            }
            if (glowGlobe) {
                glowGlobe.style.transform =
                    `translateY(-50%) translate3d(${vx * 0.5}px, ${vy * 0.5}px, 0)`;
            }

            /* Content — very subtle opposite */
            cx = lerp(cx, tx * 2.5, 0.04);
            cy = lerp(cy, ty * 2.5, 0.04);
            if (content) {
                content.style.transform =
                    `translate3d(${cx}px, ${cy}px, 0)`;
            }

            /* Left glow follows cursor */
            if (glowLeft) {
                const gl_x = lerp(
                    parseFloat(glowLeft.style.getPropertyValue('--gx') || '-160'),
                    -160 + tx * 40,
                    0.05
                );
                const gl_y = lerp(
                    parseFloat(glowLeft.style.getPropertyValue('--gy') || '30'),
                    30 + ty * 20,
                    0.05
                );
                glowLeft.style.setProperty('--gx', gl_x);
                glowLeft.style.setProperty('--gy', gl_y);
                glowLeft.style.transform =
                    `translate3d(${gl_x}px, calc(${gl_y}% + 0px), 0)`;
            }

            /* Float card — faster offset for depth */
            fx = lerp(fx, tx * 12, 0.05);
            fy = lerp(fy, ty * 10, 0.05);
            if (floatCard) {
                floatCard.style.transform =
                    `translate3d(${fx}px, ${fy}px, 0)`;
            }
        });
    }

    /* ================================================================
       4. INTERACTIVE GLASS HOVER (radial highlight follows mouse)
    ================================================================ */
    function initGlassHover() {
        const glassEls = document.querySelectorAll('.glass-nav, .float-card, .cap-card');

        glassEls.forEach(el => {
            el.addEventListener('mousemove', e => {
                const rect = el.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
                const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
                el.style.setProperty('--mouse-x', x);
                el.style.setProperty('--mouse-y', y);
            });
        });
    }

    /* ================================================================
       5. MAGNETIC BUTTONS
    ================================================================ */
    function initMagneticButtons() {
        if (isTouchDevice()) return;

        const buttons = document.querySelectorAll('.magnetic-btn');

        buttons.forEach(btn => {
            let bx = 0, by = 0;
            let resting = true;

            btn.addEventListener('mousemove', e => {
                const rect = btn.getBoundingClientRect();
                const cx = rect.left + rect.width  / 2;
                const cy = rect.top  + rect.height / 2;
                const dx = (e.clientX - cx) / (rect.width  / 2);
                const dy = (e.clientY - cy) / (rect.height / 2);
                bx = dx * 5;
                by = dy * 5;
                resting = false;
                btn.style.transform = `translate3d(${bx}px, ${by}px, 0) scale(1.03)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = `translate3d(0, 0, 0) scale(1)`;
                bx = 0; by = 0;
                resting = true;
            });
        });
    }

    /* ================================================================
       6. PARTICLE CANVAS
    ================================================================ */
    function initParticles() {
        if (prefersReducedMotion()) return;

        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let W, H;
        const PARTICLE_COUNT = 55;

        function resize() {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        /* Create particles — drifting gently, right-side weighted */
        const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x:    Math.random() * W,
            y:    Math.random() * H,
            r:    Math.random() * 1.2 + 0.3,
            vx:   (Math.random() - 0.5) * 0.12,
            vy:   (Math.random() - 0.5) * 0.10 - 0.04,
            alpha: Math.random() * 0.35 + 0.05,
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0)  p.x = W;
                if (p.x > W)  p.x = 0;
                if (p.y < -5) p.y = H;
                if (p.y > H)  p.y = -5;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 210, 255, ${p.alpha})`;
                ctx.fill();
            });

            requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);
    }

    /* ================================================================
       7. SCROLL PARALLAX (subtle opacity fade on hero scroll)
    ================================================================ */
    function initScrollParallax() {
        if (prefersReducedMotion()) return;

        const hero    = document.getElementById('hero');
        const content = document.getElementById('heroContent');

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const heroH   = hero ? hero.offsetHeight : window.innerHeight;
            const progress = Math.min(scrollY / heroH, 1);

            if (content) {
                content.style.opacity = 1 - progress * 1.4;
                content.style.transform =
                    `translate3d(0, ${-progress * 30}px, 0)`;
            }
        }, { passive: true });
    }

    /* ================================================================
       7.5. NAVBAR SCROLL SHOW/HIDE
    ================================================================ */
    function initNavbar() {
        const nav = document.getElementById('glassNav');
        if (!nav) return;

        let lastScrollY = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const heroH = window.innerHeight;

                    /* Add scrolled class after leaving hero */
                    if (currentScrollY > heroH * 0.3) {
                        nav.classList.add('nav-scrolled');
                    } else {
                        nav.classList.remove('nav-scrolled');
                    }

                    /* Hide on scroll down, show on scroll up */
                    if (currentScrollY > lastScrollY && currentScrollY > 200) {
                        nav.classList.add('nav-hidden');
                    } else {
                        nav.classList.remove('nav-hidden');
                    }

                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ================================================================
       7.6. APPROACH TIMELINE SCROLL PROGRESS
    ================================================================ */
    function initApproachProgress() {
        if (prefersReducedMotion()) return;

        const timeline = document.querySelector('.approach-timeline');
        if (!timeline) return;

        window.addEventListener('scroll', () => {
            const rect = timeline.getBoundingClientRect();
            const viewH = window.innerHeight;
            /* Progress: 0 when top enters viewport, 1 when bottom leaves */
            const start = viewH * 0.8;
            const end = viewH * 0.2;
            const total = start - end;
            const progress = Math.max(0, Math.min(1, (start - rect.top) / total));
            timeline.style.setProperty('--approach-progress', progress);
        }, { passive: true });
    }

    /* ================================================================
       8. SCROLL REVEAL ANIMATIONS
    ================================================================ */
    function initScrollReveal() {
        const revealEls = document.querySelectorAll('.fade-up');
        if (prefersReducedMotion() || revealEls.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.1
        });

        revealEls.forEach(el => observer.observe(el));
    }

    /* ================================================================
       INIT — Run everything after DOM ready
    ================================================================ */
    function init() {
        runEntranceAnimations();
        initCursor();
        initProjectCursor();
        initParallax();
        initGlassHover();
        initMagneticButtons();
        initParticles();
        initScrollParallax();
        initNavbar();
        initApproachProgress();
        initScrollReveal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
