// ============================================================
// Flavio Leone — "Editorial Index"
// Content: assets/work.json  { projects:[{slug,title,meta,images:[{src,alt,w,h}]}], all:[...] }
// ============================================================

let projects = [];
let allWork = [];
let currentList = [];
let currentIndex = 0;

const MANIFEST = '/assets/work.json';

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initLightbox();
    loadManifest();
});

function initNav() {
    const t = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (t && links) t.addEventListener('click', () => links.classList.toggle('open'));
}

async function loadManifest() {
    try {
        const res = await fetch(MANIFEST);
        if (!res.ok) throw new Error('manifest');
        const data = await res.json();
        projects = data.projects || [];
        allWork = (data.all && data.all.length) ? data.all : projects.flatMap(p => p.images || []);
        render();
    } catch (e) {
        console.error(e);
        document.querySelectorAll('[data-fill]').forEach(el => {
            el.innerHTML = '<p style="color:var(--muted)">Could not load images — please refresh.</p>';
        });
    }
}

function render() {
    const stage = document.getElementById('hero-stage');
    if (stage) heroSlideshow(stage, projects.find(p => p.slug === 'recent')?.images || allWork);

    const cards = document.getElementById('cards');
    if (cards) renderCards(cards, projects);

    const work = document.getElementById('work-gallery');
    if (work) renderMasonry(work, allWork);

    const idx = document.getElementById('work-index');
    if (idx) renderIndex(idx, allWork);

    document.querySelectorAll('[data-project]').forEach(el => {
        const p = projects.find(x => x.slug === el.getAttribute('data-project'));
        if (p) renderMasonry(el, p.images || []);
    });

    initViewToggle();
}

const ar = (im) => (im.w && im.h) ? `${im.w} / ${im.h}` : '1';

// ---------- Hero crossfade slideshow ----------
function heroSlideshow(stage, images) {
    const set = images.slice(0, 6);
    if (!set.length) return;
    stage.innerHTML = '';
    set.forEach((im, i) => {
        const img = document.createElement('img');
        img.src = im.src; img.alt = im.alt || '';
        img.loading = i === 0 ? 'eager' : 'lazy';
        if (i === 0) img.classList.add('on');
        stage.appendChild(img);
    });
    const meta = document.createElement('span');
    meta.className = 'stage-meta';
    stage.appendChild(meta);

    const imgs = [...stage.querySelectorAll('img')];
    let cur = 0;
    const show = (n) => { imgs[cur].classList.remove('on'); cur = n; imgs[cur].classList.add('on'); meta.textContent = set[cur].alt; };
    show(0);
    stage.addEventListener('click', () => openLightbox(set, cur));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && imgs.length > 1) {
        setInterval(() => show((cur + 1) % imgs.length), 4200);
    }
}

// ---------- Project cards ----------
function renderCards(container, items) {
    container.innerHTML = '';
    items.forEach(p => {
        const cover = (p.images && p.images[0]) || {};
        const a = document.createElement('a');
        a.className = 'card';
        a.href = `/projects/${p.slug}.html`;
        a.innerHTML =
            `<div class="frame"><img src="${cover.src}" alt="${cover.alt || p.title}" loading="lazy" style="--ar:${ar(cover)}"></div>` +
            `<div class="cap"><span class="t">${p.title}</span><span class="n">${p.meta || ''} · ${(p.images || []).length}</span></div>`;
        container.appendChild(a);
    });
}

// ---------- Masonry ----------
function renderMasonry(container, images) {
    container.innerHTML = '';
    images.forEach((im, i) => {
        const fig = document.createElement('figure');
        fig.className = 'tile';
        fig.innerHTML =
            `<img src="${im.src}" alt="${im.alt || ''}" loading="lazy" decoding="async" style="--ar:${ar(im)}">` +
            `<span class="idx">${String(i + 1).padStart(2, '0')}</span>`;
        fig.addEventListener('click', () => openLightbox(images, i));
        container.appendChild(fig);
    });
}

// ---------- Index list + cursor preview ----------
function renderIndex(container, images) {
    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'index-list';

    let preview = document.querySelector('.index-preview');
    if (!preview) { preview = document.createElement('img'); preview.className = 'index-preview'; preview.alt = ''; document.body.appendChild(preview); }

    images.forEach((im, i) => {
        const row = document.createElement('div');
        row.className = 'index-row';
        const title = (im.alt || 'Untitled').replace(' — Flavio Leone', '');
        row.innerHTML =
            `<span class="num">${String(i + 1).padStart(2, '0')}</span>` +
            `<span class="ti">${title.toLowerCase()}</span>` +
            `<span class="dim">${im.w && im.h ? im.w + '×' + im.h : ''}</span>`;
        row.addEventListener('mouseenter', () => { preview.src = im.src; preview.classList.add('on'); });
        row.addEventListener('mousemove', (e) => { preview.style.left = e.clientX + 'px'; preview.style.top = e.clientY + 'px'; });
        row.addEventListener('mouseleave', () => preview.classList.remove('on'));
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
    btns.forEach(b => b.addEventListener('click', () => {
        root.setAttribute('data-view', b.dataset.set);
        btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    }));
}

// ---------- Lightbox ----------
let lb, lbImg, lbCap;
function initLightbox() {
    lb = document.getElementById('lightbox');
    if (!lb) return;
    lbImg = lb.querySelector('img');
    lbCap = lb.querySelector('figcaption');
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.tagName === 'FIGURE') closeLightbox(); });
    document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('on')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });
    let x0 = 0;
    lb.addEventListener('touchstart', (e) => x0 = e.changedTouches[0].screenX, { passive: true });
    lb.addEventListener('touchend', (e) => {
        const d = x0 - e.changedTouches[0].screenX;
        if (Math.abs(d) > 50) step(d > 0 ? 1 : -1);
    }, { passive: true });
}
function openLightbox(list, i) {
    if (!list || !list.length) return;
    currentList = list; currentIndex = i; paint();
    lb.classList.add('on'); document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
}
function closeLightbox() { lb.classList.remove('on'); document.body.style.overflow = ''; }
function step(d) { currentIndex = (currentIndex + d + currentList.length) % currentList.length; paint(); }
function paint() {
    const im = currentList[currentIndex];
    lbImg.src = im.src; lbImg.alt = im.alt || '';
    lbCap.textContent = `${(im.alt || '').replace(' — Flavio Leone', '')}  ·  ${currentIndex + 1} / ${currentList.length}`;
    [-1, 1].forEach(o => { const n = currentList[currentIndex + o]; if (n) { const p = new Image(); p.src = n.src; } });
}
