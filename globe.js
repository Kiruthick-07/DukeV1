/* ============================================================
   FLUXR.IN — Contact Globe Animation
   Canvas 2D · Dark wireframe · Network arcs · Mouse parallax
   ============================================================ */

(function () {
    'use strict';

    /* ── Helpers ─────────────────────────────────────────────── */
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const isMobile = () => window.innerWidth < 900;
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

    /* ── Geographic nodes (lon, lat in degrees) ─────────────── */
    const ALL_NODES = [
        { lon:  72.8,  lat: 19.0,  label: 'Mumbai',    primary: true  },
        { lon: -0.1,   lat: 51.5,  label: 'London',    primary: true  },
        { lon: -74.0,  lat: 40.7,  label: 'New York',  primary: true  },
        { lon: 139.7,  lat: 35.7,  label: 'Tokyo',     primary: true  },
        { lon: -46.6,  lat: -23.5, label: 'São Paulo', primary: false },
        { lon:  55.3,  lat: 25.2,  label: 'Dubai',     primary: false },
        { lon: 103.8,  lat:  1.4,  label: 'Singapore', primary: false },
        { lon: 151.2,  lat: -33.9, label: 'Sydney',    primary: false },
    ];

    /* ── Arc connections (index pairs into ALL_NODES) ─────────── */
    const ARC_PAIRS = [
        [0, 1],  // Mumbai → London
        [0, 6],  // Mumbai → Singapore
        [1, 2],  // London → New York
        [2, 4],  // New York → São Paulo
        [3, 6],  // Tokyo → Singapore
        [6, 7],  // Singapore → Sydney
        [1, 5],  // London → Dubai
        [5, 0],  // Dubai → Mumbai
    ];

    /* ── Simplified continent silhouette dots ─────────────────
       Each entry is [lon, lat] — a dense sample of coastlines   */
    const CONTINENT_DOTS = [
        // North America - west coast
        [-122,48],[-124,46],[-124,43],[-122,37],[-118,34],[-117,32],[-105,20],[-90,16],
        // North America - east coast
        [-71,42],[-74,40],[-77,38],[-80,32],[-81,28],[-87,30],[-95,29],[-97,26],
        // North America - north
        [-64,44],[-60,46],[-53,47],[-57,50],[-64,55],[-75,45],[-80,43],[-83,42],
        // Central America
        [-85,10],[-84,9],[-77,8],[-75,9],[-80,8],
        // South America - west
        [-77,1],[-77,-2],[-75,-10],[-76,-15],[-71,-18],[-68,-22],[-70,-30],[-71,-38],[-72,-42],[-68,-48],[-65,-55],
        // South America - east
        [-35,-8],[-38,-12],[-42,-20],[-44,-23],[-48,-28],[-52,-33],[-58,-37],[-62,-38],[-56,-38],[-50,-30],[-45,-23],[-38,-15],[-35,-8],
        // Europe - west
        [-9,39],[-9,37],[-7,37],[-5,36],[-5,43],[-2,44],[1,43],[3,43],[5,43],[8,44],[12,44],[14,41],[16,38],[15,37],
        // Europe - north & east  
        [-3,58],[0,51],[4,51],[7,52],[9,55],[10,57],[12,56],[14,55],[18,54],[20,54],[23,53],[24,55],[26,57],[28,58],[27,60],[25,60],[22,60],[20,63],[17,63],[14,63],[11,63],[7,62],[5,59],[5,56],
        // Scandinavia
        [6,58],[5,59],[5,61],[6,63],[8,63],[10,63],[12,65],[14,66],[17,68],[20,70],[25,70],[28,71],[30,70],[28,69],[25,68],[24,65],[25,63],[28,59],[28,56],[24,55],[22,55],[20,54],[18,54],
        // Africa - west
        [-17,14],[-17,12],[-15,10],[-13,9],[-11,8],[-8,4],[-5,5],[-3,5],[0,5],[2,6],[3,5],[5,4],[4,6],[2,7],[4,10],[3,12],[2,14],[1,16],[2,18],[2,20],[5,22],[8,22],[8,24],[9,23],[11,22],[13,22],[14,23],[16,23],[14,24],[14,22],[13,20],[12,18],[14,12],[16,11],[14,10],[13,9],[12,8],[10,7],[8,6],[6,5],[4,5],[2,5],
        // Africa - east & south
        [30,10],[32,11],[36,11],[40,12],[44,11],[50,12],[51,13],[50,10],[49,11],[43,11],[41,10],[38,8],[36,2],[36,-2],[38,-6],[40,-10],[36,-20],[32,-26],[28,-30],[27,-34],[25,-34],[20,-34],[18,-32],[17,-29],[15,-22],[13,-17],[12,-15],[10,-5],[8,-4],[6,2],[4,5],
        // Middle East
        [35,37],[36,34],[37,32],[35,30],[35,29],[38,22],[40,15],[43,12],[44,15],[45,14],[50,14],[55,22],[55,23],[56,24],[58,23],[58,20],[60,22],[62,22],[62,24],[62,25],[60,25],[56,26],[50,26],[49,26],[47,29],[43,30],[38,30],[35,33],[35,37],
        // India
        [68,23],[68,22],[69,20],[72,20],[73,18],[75,15],[77,10],[80,10],[80,13],[80,16],[78,20],[76,22],[73,23],[72,25],[70,23],[68,23],
        // Southeast Asia
        [100,1],[100,3],[102,3],[104,3],[104,1],[105,-5],[108,-8],[110,-8],[111,-8],[115,-8],[116,-8],[117,-8],[118,-8],[120,-8],[120,-10],[118,-8],[115,-8],[112,-8],[110,-8],[108,-6],[106,-6],[104,-3],[102,2],[100,3],[100,5],[103,5],[105,4],[107,10],[107,12],[105,12],[104,14],[105,16],[107,16],[109,18],[110,20],[109,21],[108,22],[107,22],[106,22],[105,20],[103,18],[100,14],[99,12],[98,10],[98,8],[100,6],[102,4],[104,2],[104,1],[106,2],[108,2],[110,2],[110,0],[108,-2],[106,-8],[107,-8],[110,-8],
        // East Asia - China coast
        [117,24],[118,26],[119,26],[120,28],[122,30],[122,32],[121,34],[120,36],[120,38],[121,38],[122,38],[121,40],[119,40],[118,40],[117,40],[116,39],[115,38],[112,35],[110,28],[108,22],[106,22],[104,20],[102,22],[100,22],[99,24],[100,25],[102,26],[100,26],[99,27],[98,25],[98,23],[100,20],[102,18],[104,20],[106,22],
        // Japan
        [130,32],[131,33],[132,34],[133,34],[134,34],[135,35],[136,35],[137,35],[138,36],[140,36],[140,38],[141,39],[141,40],[140,41],[140,42],[141,43],[142,44],[143,44],[142,42],[142,40],[141,38],[140,36],[139,35],[137,35],[135,34],[134,34],[132,33],[131,33],[130,32],
        // Australia
        [114,-22],[113,-26],[114,-28],[116,-34],[118,-34],[120,-34],[122,-34],[124,-34],[126,-34],[128,-34],[130,-33],[132,-34],[134,-34],[136,-35],[138,-35],[140,-36],[142,-38],[144,-38],[146,-38],[148,-38],[150,-37],[152,-32],[153,-30],[152,-28],[150,-25],[148,-20],[146,-18],[144,-18],[142,-18],[140,-16],[138,-16],[136,-14],[134,-12],[132,-12],[130,-12],[128,-14],[126,-16],[124,-16],[122,-18],[120,-20],[118,-22],[116,-22],[114,-22],
    ];

    /* ── Main init ───────────────────────────────────────────── */
    function init() {
        const canvas = document.getElementById('contactGlobe');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        /* State */
        let W, H, cx, cy, R;          // canvas dimensions + globe center/radius
        let rotation = 0;              // current longitude rotation (radians)
        let startTime = null;
        let animFrameId = null;
        let mouseX = 0, mouseY = 0;
        let globeOffX = 0, globeOffY = 0;  // lerped mouse parallax offset

        /* Node state */
        const nodes = (isMobile() ? ALL_NODES.slice(0, 5) : ALL_NODES).map((n, i) => ({
            ...n,
            visible: false,
            opacity: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            appearTime: 1.0 + i * 0.2,
        }));

        /* Arc state */
        const arcs = (isMobile() ? ARC_PAIRS.slice(0, 4) : ARC_PAIRS).map((pair, i) => ({
            from: pair[0],
            to:   pair[1],
            progress: 0,         // 0–1 draw progress
            opacity: 0,
            phase: 'waiting',    // waiting → drawing → holding → fading
            startTime: 1.5 + i * 0.6,
            particleT: 0,        // 0–1 position along arc
            particleVisible: false,
        }));

        /* ── Sizing ───────────────────────────────────────────── */
        function resize() {
            W = canvas.offsetWidth;
            H = canvas.offsetHeight;
            canvas.width  = W * window.devicePixelRatio;
            canvas.height = H * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            /* Globe properly centered and fitted */
            if (isMobile()) {
                cx = W * 0.5;
                cy = H * 0.5;
                R  = Math.min(W, H) * 0.45;
            } else {
                cx = W * 0.5;
                cy = H * 0.5;
                R  = Math.min(W, H) * 0.42;
            }
        }
        resize();
        window.addEventListener('resize', () => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            resize();
        }, { passive: true });

        /* ── Coordinate helpers ───────────────────────────────── */
        function lonLatTo3D(lon, lat, rot) {
            const φ = lat  * Math.PI / 180;
            const λ = (lon * Math.PI / 180) + rot;
            return {
                x: Math.cos(φ) * Math.cos(λ),
                y: Math.sin(φ),
                z: Math.cos(φ) * Math.sin(λ),
            };
        }

        function project(p, offX, offY) {
            return {
                x: cx + offX + p.x * R,
                y: cy + offY - p.y * R,
                z: p.z,
            };
        }

        function isFront(p) { return p.z >= 0; }

        /* ── Great-circle arc interpolation ─────────────────── */
        function slerp(a, b, t) {
            const dot = clamp(a.x*b.x + a.y*b.y + a.z*b.z, -1, 1);
            const omega = Math.acos(dot);
            if (Math.abs(omega) < 1e-6) return { ...a };
            const s = Math.sin(omega);
            return {
                x: (Math.sin((1 - t) * omega) * a.x + Math.sin(t * omega) * b.x) / s,
                y: (Math.sin((1 - t) * omega) * a.y + Math.sin(t * omega) * b.y) / s,
                z: (Math.sin((1 - t) * omega) * a.z + Math.sin(t * omega) * b.z) / s,
            };
        }

        /* Build arc points between two lon/lat nodes */
        function buildArcPoints(fromNode, toNode, rot, segments = 48) {
            const a = lonLatTo3D(fromNode.lon, fromNode.lat, rot);
            const b = lonLatTo3D(toNode.lon,   toNode.lat,   rot);
            return Array.from({ length: segments + 1 }, (_, i) => {
                const t = i / segments;
                /* Lift the arc above the surface: max lift at midpoint */
                const lift = 1.0 + Math.sin(t * Math.PI) * 0.22;
                const pt = slerp(a, b, t);
                return { x: pt.x * lift, y: pt.y * lift, z: pt.z * lift };
            });
        }

        /* ── Draw atmosphere ────────────────────────────────── */
        function drawAtmosphere(offX, offY) {
            const grad = ctx.createRadialGradient(
                cx + offX, cy + offY, R * 0.85,
                cx + offX, cy + offY, R * 1.28
            );
            grad.addColorStop(0, 'rgba(60,140,220,0.035)');
            grad.addColorStop(0.5, 'rgba(60,120,200,0.018)');
            grad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(cx + offX, cy + offY, R * 1.28, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        /* ── Draw globe sphere ───────────────────────────────── */
        function drawSphere(offX, offY, opacity) {
            /* Base dark sphere */
            const sGrad = ctx.createRadialGradient(
                cx + offX - R * 0.25, cy + offY - R * 0.25, R * 0.1,
                cx + offX, cy + offY, R
            );
            sGrad.addColorStop(0,   `rgba(22,26,34,${opacity * 0.9})`);
            sGrad.addColorStop(0.6, `rgba(12,14,20,${opacity * 0.95})`);
            sGrad.addColorStop(1,   `rgba(5,5,8,${opacity})`);

            ctx.beginPath();
            ctx.arc(cx + offX, cy + offY, R, 0, Math.PI * 2);
            ctx.fillStyle = sGrad;
            ctx.fill();

            /* Subtle rim highlight */
            const rimGrad = ctx.createRadialGradient(
                cx + offX, cy + offY, R * 0.88,
                cx + offX, cy + offY, R * 1.02
            );
            rimGrad.addColorStop(0, 'transparent');
            rimGrad.addColorStop(0.7, `rgba(80,160,240,${opacity * 0.06})`);
            rimGrad.addColorStop(1, `rgba(80,160,240,${opacity * 0.14})`);
            ctx.beginPath();
            ctx.arc(cx + offX, cy + offY, R * 1.02, 0, Math.PI * 2);
            ctx.fillStyle = rimGrad;
            ctx.fill();
        }

        /* ── Draw lat/lng grid ───────────────────────────────── */
        function drawGrid(offX, offY, rot, opacity) {
            ctx.save();
            ctx.globalAlpha = opacity * 0.5;
            ctx.strokeStyle = 'rgba(255,255,255,0.055)';
            ctx.lineWidth = 0.5;

            /* Latitude lines */
            for (let lat = -75; lat <= 75; lat += 15) {
                ctx.beginPath();
                let first = true;
                for (let lon = -180; lon <= 180; lon += 5) {
                    const p3 = lonLatTo3D(lon, lat, rot);
                    if (!isFront(p3)) { first = true; continue; }
                    const p = project(p3, offX, offY);
                    if (first) { ctx.moveTo(p.x, p.y); first = false; }
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
            }

            /* Longitude meridians */
            for (let lon = -180; lon < 180; lon += 30) {
                ctx.beginPath();
                let first = true;
                for (let lat = -90; lat <= 90; lat += 5) {
                    const p3 = lonLatTo3D(lon, lat, rot);
                    if (!isFront(p3)) { first = true; continue; }
                    const p = project(p3, offX, offY);
                    if (first) { ctx.moveTo(p.x, p.y); first = false; }
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
            }

            ctx.restore();
        }

        /* ── Draw continent dots ─────────────────────────────── */
        function drawContinents(offX, offY, rot, opacity) {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = 'rgba(255,255,255,0.085)';

            CONTINENT_DOTS.forEach(([lon, lat]) => {
                const p3 = lonLatTo3D(lon, lat, rot);
                if (!isFront(p3)) return;
                /* Depth fade: dimmer when near edge of globe */
                const depthAlpha = clamp((p3.z - 0.05) / 0.7, 0, 1);
                if (depthAlpha < 0.05) return;
                const p = project(p3, offX, offY);
                ctx.globalAlpha = opacity * depthAlpha * 0.7;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        }

        /* ── Draw network nodes ─────────────────────────────── */
        function drawNodes(offX, offY, rot, t, nodeOpacities) {
            nodes.forEach((node, i) => {
                if (nodeOpacities[i] <= 0) return;
                const p3 = lonLatTo3D(node.lon, node.lat, rot);
                if (!isFront(p3)) return;
                const depth = clamp((p3.z + 0.1) / 1.1, 0, 1);
                const p = project(p3, offX, offY);
                const op = nodeOpacities[i] * depth;
                if (op <= 0.02) return;

                const pulse = 0.75 + Math.sin(t * 1.8 + node.pulsePhase) * 0.25;
                const baseR = node.primary ? 3.5 : 2.0;
                const r = baseR * pulse;

                /* Outer glow */
                const gGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
                gGrad.addColorStop(0, `rgba(100,180,255,${op * (node.primary ? 0.3 : 0.15)})`);
                gGrad.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
                ctx.fillStyle = gGrad;
                ctx.fill();

                /* Core dot */
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fillStyle = node.primary
                    ? `rgba(140,200,255,${op * 0.9})`
                    : `rgba(100,170,240,${op * 0.6})`;
                ctx.fill();

                /* Inner bright center */
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * 0.45, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(220,240,255,${op * 0.9})`;
                ctx.fill();
            });
        }

        /* ── Draw one arc ────────────────────────────────────── */
        function drawArc(arc, offX, offY, rot, t) {
            if (arc.opacity <= 0) return;
            if (arc.from >= nodes.length || arc.to >= nodes.length) return;

            const fromNode = nodes[arc.from];
            const toNode   = nodes[arc.to];
            const pts = buildArcPoints(fromNode, toNode, rot);

            /* How many segments to draw based on progress */
            const visibleCount = Math.floor(arc.progress * (pts.length - 1));
            if (visibleCount < 1) return;

            /* Filter to front-visible points; draw as path segments */
            ctx.save();
            ctx.lineWidth = 0.9;
            ctx.lineCap = 'round';

            let inPath = false;
            let prevFront = false;

            for (let i = 0; i <= visibleCount; i++) {
                const p3 = pts[i];
                const front = p3.z >= -0.05;
                const depth = clamp((p3.z + 0.1) / 1.1, 0, 1);
                const p = project(p3, offX, offY);
                const segOpacity = arc.opacity * depth;

                if (!front) {
                    if (inPath) { ctx.stroke(); inPath = false; }
                    prevFront = false;
                    continue;
                }

                if (!prevFront || !inPath) {
                    if (inPath) ctx.stroke();
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(80,160,240,${segOpacity * 0.55})`;
                    ctx.moveTo(p.x, p.y);
                    inPath = true;
                } else {
                    ctx.lineTo(p.x, p.y);
                }
                prevFront = true;
            }
            if (inPath) ctx.stroke();

            /* Travelling particle */
            if (arc.particleVisible && arc.progress > 0.05) {
                const pT = clamp(arc.particleT, 0, 0.999);
                const pidx = Math.floor(pT * (pts.length - 1));
                const pp3 = pts[pidx];
                if (pp3 && pp3.z >= 0) {
                    const depth = clamp((pp3.z + 0.1) / 1.1, 0, 1);
                    const pp = project(pp3, offX, offY);
                    const pGrad = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, 6);
                    pGrad.addColorStop(0,   `rgba(200,230,255,${arc.opacity * depth * 0.95})`);
                    pGrad.addColorStop(0.4, `rgba(100,180,255,${arc.opacity * depth * 0.5})`);
                    pGrad.addColorStop(1, 'transparent');
                    ctx.beginPath();
                    ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2);
                    ctx.fillStyle = pGrad;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(pp.x, pp.y, 1.8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(230,245,255,${arc.opacity * depth})`;
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        /* ── Dark left-side overlay for text readability ─────── */
        function drawLeftOverlay() {
            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0,    'rgba(5,5,8,1.0)');
            grad.addColorStop(0.28, 'rgba(5,5,8,0.88)');
            grad.addColorStop(0.50, 'rgba(5,5,8,0.35)');
            grad.addColorStop(0.70, 'rgba(5,5,8,0.0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        /* On mobile: overlay from top (globe behind) */
        function drawMobileOverlay(globeOpacity) {
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0,    `rgba(5,5,8,${0.95 - globeOpacity * 0.15})`);
            grad.addColorStop(0.35, `rgba(5,5,8,${0.7  - globeOpacity * 0.1})`);
            grad.addColorStop(0.65, `rgba(5,5,8,${0.3})`);
            grad.addColorStop(1,    'rgba(5,5,8,0.0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        /* ── Mouse interaction ───────────────────────────────── */
        if (!isTouchDevice()) {
            const section = document.getElementById('contact');
            if (section) {
                section.addEventListener('mousemove', e => {
                    const rect = section.getBoundingClientRect();
                    mouseX = (e.clientX - rect.left - rect.width  / 2) / rect.width;
                    mouseY = (e.clientY - rect.top  - rect.height / 2) / rect.height;
                }, { passive: true });
                section.addEventListener('mouseleave', () => {
                    mouseX = 0;
                    mouseY = 0;
                }, { passive: true });
            }
        }

        /* ── Visibility observer (pause when off-screen) ─────── */
        let isVisible = false;
        const observer = new IntersectionObserver(entries => {
            isVisible = entries[0].isIntersecting;
            if (isVisible && !animFrameId) loop();
        }, { threshold: 0.05 });
        observer.observe(canvas);

        /* ── Arc state machine timing ──────────────────────────
           Loop period = 6s
           0–0.5s: dark
           0.5–1.5s: globe emerges
           1.5–2.5s: nodes appear
           2–5s:   arcs animate in, hold, fade
           5–6s:   all fades, reset
        */
        const LOOP = 6.0;
        /* Arc phases per-arc: startTime within loop */

        /* ── Main draw loop ─────────────────────────────────── */
        function loop(ts) {
            animFrameId = null;
            if (!isVisible) return;

            if (!startTime) startTime = ts;
            const elapsed = (ts - startTime) / 1000; // seconds since page load
            const t = elapsed;
            const tLoop = t % LOOP;

            /* Globe opacity */
            let globeOp;
            if (tLoop < 0.5) {
                globeOp = 0;
            } else if (tLoop < 1.5) {
                globeOp = (tLoop - 0.5) / 1.0;
            } else if (tLoop < 5.0) {
                globeOp = 1.0;
            } else {
                globeOp = 1.0 - (tLoop - 5.0) / 1.0;
            }
            globeOp = clamp(globeOp, 0, 1);

            /* Smooth globe rotation */
            rotation = t * 0.04; // Faster rotation

            /* Mouse parallax (desktop) */
            const targetOffX = isTouchDevice() ? 0 : mouseX * 7;
            const targetOffY = isTouchDevice() ? 0 : mouseY * 5;
            globeOffX = lerp(globeOffX, targetOffX, 0.05);
            globeOffY = lerp(globeOffY, targetOffY, 0.05);

            const offX = globeOffX;
            const offY = globeOffY;

            /* ── Node opacity ── */
            const nodeOpacities = nodes.map((node, i) => {
                /* Appear time is relative to loop start */
                const loopAppear = node.appearTime;
                let op;
                if (tLoop < loopAppear) {
                    op = 0;
                } else if (tLoop < loopAppear + 0.4) {
                    op = (tLoop - loopAppear) / 0.4;
                } else if (tLoop < 4.5) {
                    op = 1.0;
                } else {
                    op = 1.0 - (tLoop - 4.5) / 1.5;
                }
                return clamp(op, 0, 1) * globeOp;
            });

            /* ── Arc state machine ── */
            if (!reducedMotion()) {
                arcs.forEach((arc, i) => {
                    const arcStartLoop = arc.startTime; // within loop
                    const dt = 0.016; // ~60fps approximate

                    if (tLoop < arcStartLoop) {
                        /* Reset for this loop */
                        arc.progress = 0;
                        arc.opacity = 0;
                        arc.particleT = 0;
                        arc.particleVisible = false;
                        arc.phase = 'waiting';
                    } else if (arc.phase === 'waiting' && tLoop >= arcStartLoop) {
                        arc.phase = 'drawing';
                        arc.progress = 0;
                        arc.opacity = 0.9;
                        arc.particleT = 0;
                        arc.particleVisible = true;
                    }

                    if (arc.phase === 'drawing') {
                        arc.progress = clamp(arc.progress + dt / 1.0, 0, 1);
                        arc.particleT = arc.progress;
                        if (arc.progress >= 1) {
                            arc.phase = 'holding';
                            arc.particleVisible = false;
                        }
                    } else if (arc.phase === 'holding') {
                        /* Hold for 0.5s then fade */
                        if (!arc._holdStart) arc._holdStart = tLoop;
                        if (tLoop - arc._holdStart > 0.5) {
                            arc.phase = 'fading';
                            arc._holdStart = null;
                        }
                    } else if (arc.phase === 'fading') {
                        arc.opacity = clamp(arc.opacity - dt / 0.8, 0, 1);
                        if (arc.opacity <= 0) {
                            arc.phase = 'done';
                        }
                    }

                    /* At loop reset (tLoop near 0), reset all */
                    if (tLoop < 0.5) {
                        arc.phase = 'waiting';
                        arc.progress = 0;
                        arc.opacity = 0;
                        arc.particleT = 0;
                        arc.particleVisible = false;
                        arc._holdStart = null;
                    }

                    arc.opacity *= globeOp;
                });
            }

            /* ── RENDER ── */
            ctx.clearRect(0, 0, W, H);

            /* Fill background */
            ctx.fillStyle = '#050508';
            ctx.fillRect(0, 0, W, H);

            if (globeOp > 0.01) {
                drawAtmosphere(offX, offY);
                drawSphere(offX, offY, globeOp);
                drawContinents(offX, offY, rotation, globeOp * 0.9);
                drawGrid(offX, offY, rotation, globeOp);

                /* Arcs (behind nodes) */
                arcs.forEach(arc => drawArc(arc, offX, offY, rotation, t));

                /* Nodes */
                drawNodes(offX, offY, rotation, t, nodeOpacities);
            }

            /* Overlay to protect text legibility */
            if (isMobile()) {
                drawMobileOverlay(globeOp);
            } else {
                drawLeftOverlay();
            }

            animFrameId = requestAnimationFrame(loop);
        }

        /* Reduced motion: draw a static faint globe, no animation */
        if (reducedMotion()) {
            requestAnimationFrame(ts => {
                startTime = ts;
                const offX = 0, offY = 0;
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#050508';
                ctx.fillRect(0, 0, W, H);
                drawAtmosphere(offX, offY);
                drawSphere(offX, offY, 0.45);
                drawContinents(offX, offY, 0.3, 0.45);
                drawGrid(offX, offY, 0.3, 0.45);
                drawLeftOverlay();
            });
            return;
        }

        animFrameId = requestAnimationFrame(loop);
    }

    /* ── Bootstrap ───────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
