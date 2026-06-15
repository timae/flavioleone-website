// ============================================================
// Flavio Leone — "STUDIO / KINETIC" (artsy cut)
// ============================================================

let projects = [], allWork = [], currentList = [], currentIndex = 0;
const MANIFEST = '/assets/work.json';
const ar = (im) => (im.w && im.h) ? `${im.w} / ${im.h}` : '3 / 4';
const clean = (s) => (s || '').replace(' — Flavio Leone', '');

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initLightbox();
    loadManifest();
});

async function loadManifest() {
    try {
        const res = await fetch(MANIFEST);
        const data = await res.json();
        projects = data.projects || [];
        allWork = (data.all && data.all.length) ? data.all : projects.flatMap(p => p.images || []);
        render();
    } catch (e) { console.error(e); }
}

function render() {
    const montage = document.getElementById('hero-montage');
    if (montage) heroMontage(montage, (projects.find(p => p.slug === 'recent')?.images || allWork));

    const collage = document.getElementById('collage');
    if (collage) renderCollage(collage, collage.dataset.all ? allWork : allWork.slice(0, 16));

    document.querySelectorAll('[data-reel]').forEach(el => {
        const p = projects.find(x => x.slug === el.dataset.reel);
        if (p) renderReel(el, p.images || []);
    });

    const idx = document.getElementById('work-index');
    if (idx) renderIndex(idx, allWork);

    initViewToggle();
    initReveal();
    hoverTargets();
    initScrollBloom();
}

// ---------- Scroll-driven colour bloom (touch: no hover to trigger it) ----------
function initScrollBloom() {
    if (!matchMedia('(hover: none), (pointer: coarse)').matches) return;
    const shards = () => document.querySelectorAll('.shard');
    let ticking = false;
    function update() {
        ticking = false;
        const vh = innerHeight, mid = vh / 2;
        shards().forEach(el => {
            const b = el.getBoundingClientRect();
            if (b.bottom < -40 || b.top > vh + 40) return;
            const c = b.top + b.height / 2;
            // 0 when centred, 1 toward the viewport edges → grayscale amount
            const g = Math.min(1, Math.abs(c - mid) / mid * 1.15);
            el.style.setProperty('--g', g.toFixed(2));
        });
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    update();
}

// ---------- Custom cursor ----------
let cursor, cdot;
function initCursor() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.innerHTML = '<div class="dot"></div><div class="word">view</div>';
    document.body.appendChild(cursor);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
    (function loop() { cx += (x - cx) * .2; cy += (y - cy) * .2; cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
}
function hoverTargets() {
    if (!cursor) return;
    document.querySelectorAll('[data-cursor="view"]').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hot'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hot'));
    });
}

// ---------- Hero montage ----------
function heroMontage(stage, images) {
    const pool = images.filter(im => im && im.src);
    if (!pool.length) return;
    stage.innerHTML = '';
    // three slots, each tracking which pool index it currently shows
    const slots = [];
    for (let k = 0; k < 3 && k < pool.length; k++) {
        const img = document.createElement('img');
        img.src = pool[k].src; img.alt = pool[k].alt || ''; img.classList.add('on');
        stage.appendChild(img);
        slots.push({ el: img, idx: k });
    }
    if (pool.length <= 3 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ptr = 3 % pool.length;
    const visible = () => slots.map(s => s.idx);
    function advance(slot) {
        let guard = 0;
        while (visible().includes(ptr) && guard < pool.length) { ptr = (ptr + 1) % pool.length; guard++; }
        const pick = ptr, im = pool[pick];
        ptr = (ptr + 1) % pool.length;
        slot.el.classList.remove('on');                 // fade out
        setTimeout(() => {                               // swap once hidden, fade back in
            slot.el.src = im.src; slot.el.alt = im.alt || ''; slot.idx = pick;
            slot.el.classList.add('on');
        }, 820);
    }
    // each slot cycles on its own staggered cadence so the rotation feels organic
    slots.forEach((slot, k) => setInterval(() => advance(slot), 4200 + k * 1700));
}

// ---------- Collage ----------
function renderCollage(container, images) {
    container.innerHTML = '';
    images.forEach((im, i) => {
        const a = document.createElement('a');
        a.className = 'shard reveal';
        a.href = im.src; a.setAttribute('data-cursor', 'view');
        a.style.setProperty('--ar', ar(im));
        a.innerHTML = `<img src="${im.src}" alt="${im.alt || ''}" loading="lazy" decoding="async"><span class="tag">${clean(im.alt) || 'untitled'}</span>`;
        a.addEventListener('click', e => { e.preventDefault(); openLightbox(images, i); });
        container.appendChild(a);
    });
}

// ---------- Drag reel ----------
function renderReel(container, images) {
    container.innerHTML = '';
    images.forEach((im, i) => {
        const f = document.createElement('figure');
        f.className = 'frame'; f.setAttribute('data-cursor', 'view');
        f.innerHTML = `<img src="${im.src}" alt="${im.alt || ''}" loading="lazy" style="aspect-ratio:${ar(im)}">`;
        f.addEventListener('click', () => { if (!dragged) openLightbox(images, i); });
        container.appendChild(f);
    });
    enableDrag(container);
}
let dragged = false;
function enableDrag(el) {
    let down = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', e => { down = true; dragged = false; sx = e.clientX; sl = el.scrollLeft; el.classList.add('drag'); el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!down) return; const d = e.clientX - sx; if (Math.abs(d) > 4) dragged = true; el.scrollLeft = sl - d; });
    const up = () => { down = false; el.classList.remove('drag'); setTimeout(() => dragged = false, 50); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
}

// ---------- Index ----------
function renderIndex(container, images) {
    container.innerHTML = '';
    const list = document.createElement('div'); list.className = 'index-list';
    images.forEach((im, i) => {
        const row = document.createElement('div');
        row.className = 'index-row'; row.setAttribute('data-cursor', 'view');
        row.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span><span class="ti">${(clean(im.alt) || 'untitled').toLowerCase()}</span><span class="dim">${im.w ? im.w + '×' + im.h : ''}</span>`;
        row.addEventListener('click', () => openLightbox(images, i));
        list.appendChild(row);
    });
    container.appendChild(list);
}

// ---------- View toggle ----------
function initViewToggle() {
    const root = document.querySelector('[data-view]');
    const btns = document.querySelectorAll('.view-toggle button');
    if (!root || !btns.length) return;
    btns.forEach(b => b.addEventListener('click', () => { root.setAttribute('data-view', b.dataset.set); btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
}

// ---------- Reveal ----------
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -10% 0px' });
    els.forEach(e => io.observe(e));
}

// ---------- Lightbox (immersive) ----------
let lb, lbNo, lbImg, lbTtl, lbDim, lbStrip, lbWheelLock = false, lbStripFor = null;
function initLightbox() {
    lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.innerHTML =
        '<div class="lb-no" aria-hidden="true"></div>' +
        '<button class="lb-x" data-cursor="view" aria-label="Close">close</button>' +
        '<div class="lb-frame"><img src="" alt=""></div>' +
        '<div class="lb-side"><div class="lb-ttl serif"></div><div class="lb-dim"></div></div>' +
        '<button class="lb-arrow lb-p" data-cursor="view" aria-label="Previous">&lsaquo;</button>' +
        '<button class="lb-arrow lb-n" data-cursor="view" aria-label="Next">&rsaquo;</button>' +
        '<div class="lb-strip" aria-hidden="true"></div>';
    lbNo = lb.querySelector('.lb-no');
    lbImg = lb.querySelector('.lb-frame img');
    lbTtl = lb.querySelector('.lb-ttl');
    lbDim = lb.querySelector('.lb-dim');
    lbStrip = lb.querySelector('.lb-strip');

    lb.querySelector('.lb-x').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-p').addEventListener('click', e => { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-n').addEventListener('click', e => { e.stopPropagation(); step(1); });
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-frame')) closeLightbox(); });
    addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    lb.addEventListener('wheel', e => { if (!lb.classList.contains('on')) return; e.preventDefault(); if (lbWheelLock) return; const d = e.deltaY + e.deltaX; if (Math.abs(d) < 8) return; lbWheelLock = true; step(d > 0 ? 1 : -1); setTimeout(() => lbWheelLock = false, 380); }, { passive: false });
    let x0 = 0;
    lb.addEventListener('touchstart', e => x0 = e.changedTouches[0].screenX, { passive: true });
    lb.addEventListener('touchend', e => { const d = x0 - e.changedTouches[0].screenX; if (Math.abs(d) > 50) step(d > 0 ? 1 : -1); }, { passive: true });
}

function buildStrip(list) {
    lbStrip.innerHTML = '';
    list.forEach((im, i) => {
        const t = document.createElement('img');
        t.src = im.src; t.alt = ''; t.loading = 'lazy';
        t.addEventListener('click', () => { currentIndex = i; paint(); });
        lbStrip.appendChild(t);
    });
    lbStripFor = list;
}

function openLightbox(list, i) {
    if (!list || !list.length) return;
    currentList = list; currentIndex = i;
    if (lbStripFor !== list) buildStrip(list);
    paint(); lb.classList.add('on'); document.body.style.overflow = 'hidden';
}
function closeLightbox() { lb.classList.remove('on'); document.body.style.overflow = ''; }
function step(d) { currentIndex = (currentIndex + d + currentList.length) % currentList.length; paint(); }

function reanim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

function paint() {
    const im = currentList[currentIndex];
    lbImg.src = im.src; lbImg.alt = im.alt || '';
    lbNo.textContent = String(currentIndex + 1).padStart(2, '0');
    lbTtl.textContent = (clean(im.alt) || 'untitled').toLowerCase();
    lbDim.textContent = `${im.w && im.h ? im.w + ' × ' + im.h + '   ·   ' : ''}${currentIndex + 1} / ${currentList.length}`;
    reanim(lbImg, 'swap'); reanim(lbNo, 'swap');
    // highlight + reveal current thumb
    [...lbStrip.children].forEach((t, i) => t.classList.toggle('cur', i === currentIndex));
    const cur = lbStrip.children[currentIndex];
    if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    // preload neighbours
    [-1, 1].forEach(o => { const n = currentList[currentIndex + o]; if (n) { const p = new Image(); p.src = n.src; } });
}
