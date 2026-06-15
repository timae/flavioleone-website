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
    const set = images.slice(0, 3);
    stage.innerHTML = '';
    set.forEach(im => {
        const img = document.createElement('img');
        img.src = im.src; img.alt = im.alt || ''; img.classList.add('on');
        stage.appendChild(img);
    });
    // gently cycle the big image through the reel
    const big = stage.querySelector('img');
    if (big && images.length > 3 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let i = 0;
        setInterval(() => {
            i = (i + 1) % images.length;
            big.classList.remove('on');
            setTimeout(() => { big.src = images[i].src; big.alt = images[i].alt || ''; big.classList.add('on'); }, 600);
        }, 4600);
    }
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

// ---------- Lightbox ----------
let lb, lbImg, lbCap;
function initLightbox() {
    lb = document.getElementById('lightbox');
    if (!lb) return;
    lbImg = lb.querySelector('img'); lbCap = lb.querySelector('figcaption');
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); step(1); });
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    let x0 = 0;
    lb.addEventListener('touchstart', e => x0 = e.changedTouches[0].screenX, { passive: true });
    lb.addEventListener('touchend', e => { const d = x0 - e.changedTouches[0].screenX; if (Math.abs(d) > 50) step(d > 0 ? 1 : -1); }, { passive: true });
}
function openLightbox(list, i) { if (!list || !list.length) return; currentList = list; currentIndex = i; paint(); lb.classList.add('on'); document.body.style.overflow = 'hidden'; }
function closeLightbox() { lb.classList.remove('on'); document.body.style.overflow = ''; }
function step(d) { currentIndex = (currentIndex + d + currentList.length) % currentList.length; paint(); }
function paint() { const im = currentList[currentIndex]; lbImg.src = im.src; lbImg.alt = im.alt || ''; lbCap.textContent = `${clean(im.alt)}  ·  ${currentIndex + 1} / ${currentList.length}`; [-1, 1].forEach(o => { const n = currentList[currentIndex + o]; if (n) { const p = new Image(); p.src = n.src; } }); }
