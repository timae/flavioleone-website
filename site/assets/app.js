// ========================================
// Flavio Leone — projects + gallery + lightbox
// Content lives in assets/work.json (grouped by project).
// ========================================

let projects = [];
let currentList = [];   // image set the lightbox is currently navigating
let currentIndex = 0;

const THEMES = ['theme-a', 'theme-b', 'theme-c', 'theme-d', 'theme-e', 'theme-f'];
const MANIFEST_PATH = '/assets/work.json';

document.addEventListener('DOMContentLoaded', () => {
    applyBackgroundTheme();
    initLightbox();
    loadManifest();
});

// ---------- Background theme (random per session) ----------
function applyBackgroundTheme() {
    let theme = sessionStorage.getItem('bgTheme');
    if (!theme) {
        theme = THEMES[Math.floor(Math.random() * THEMES.length)];
        sessionStorage.setItem('bgTheme', theme);
    }
    document.body.classList.add(theme);
}

// ---------- Manifest ----------
async function loadManifest() {
    try {
        const response = await fetch(MANIFEST_PATH);
        if (!response.ok) throw new Error('Failed to load manifest');
        const data = await response.json();
        projects = data.projects || [];
        render();
    } catch (error) {
        console.error('Error loading manifest:', error);
        showError('Failed to load images. Please refresh the page.');
    }
}

function allImages() {
    return projects.flatMap(p => p.images || []);
}

function showError(message) {
    document.querySelectorAll('.gallery-grid, .projects-grid').forEach(el => {
        el.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">${message}</p>`;
    });
}

// ---------- Rendering ----------
function render() {
    // Home: project cards
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) renderProjectCards(projectsGrid, projects);

    // Work: every image, flat
    const workGallery = document.getElementById('work-gallery');
    if (workGallery) renderGallery(workGallery, allImages());

    // Project pages: a grid tagged with data-project="<slug>"
    document.querySelectorAll('[data-project]').forEach(el => {
        const proj = projects.find(p => p.slug === el.getAttribute('data-project'));
        if (proj) renderGallery(el, proj.images || []);
    });
}

function renderProjectCards(container, items) {
    container.innerHTML = '';
    items.forEach(p => {
        const cover = (p.images && p.images[0]) || { src: '', alt: '' };
        const a = document.createElement('a');
        a.className = 'project-card';
        a.href = `/projects/${p.slug}.html`;
        a.setAttribute('aria-label', p.title);
        a.innerHTML =
            `<div class="thumb"><img src="${cover.src}" alt="${cover.alt || p.title}" loading="lazy" decoding="async"></div>` +
            `<div class="card-label"><span class="t">${p.title}</span><span class="m">${p.meta || ''}</span></div>`;
        container.appendChild(a);
    });
}

function renderGallery(container, images) {
    container.innerHTML = '';
    images.forEach((item, i) => {
        const figure = document.createElement('figure');
        figure.className = 'gallery-item';
        figure.setAttribute('role', 'button');
        figure.setAttribute('tabindex', '0');

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';

        figure.appendChild(img);
        container.appendChild(figure);

        figure.addEventListener('click', () => openLightbox(images, i));
        figure.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(images, i);
            }
        });
    });
}

// ---------- Lightbox ----------
let lightbox, lightboxImg, lightboxCounter;
let touchStartX = 0;
let touchEndX = 0;

function initLightbox() {
    lightbox = document.getElementById('lightbox');
    lightboxImg = document.getElementById('lightbox-img');
    lightboxCounter = document.getElementById('lightbox-counter');
    if (!lightbox) return;

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', showPrevImage);
    lightbox.querySelector('.lightbox-next').addEventListener('click', showNextImage);

    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', handleLightboxKeyboard);
    lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
    lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function openLightbox(list, index) {
    if (!list || !list.length) return;
    currentList = list;
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightboxImage() {
    const item = currentList[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt || '';
    lightboxCounter.textContent = `${currentIndex + 1} / ${currentList.length}`;
    preloadImage(currentIndex - 1);
    preloadImage(currentIndex + 1);
}

function showPrevImage() {
    currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    updateLightboxImage();
}

function showNextImage() {
    currentIndex = (currentIndex + 1) % currentList.length;
    updateLightboxImage();
}

function preloadImage(index) {
    if (index < 0 || index >= currentList.length) return;
    const img = new Image();
    img.src = currentList[index].src;
}

function handleLightboxKeyboard(e) {
    if (!lightbox.classList.contains('active')) return;
    switch (e.key) {
        case 'Escape': closeLightbox(); break;
        case 'ArrowLeft': showPrevImage(); break;
        case 'ArrowRight': showNextImage(); break;
    }
}

function handleTouchStart(e) { touchStartX = e.changedTouches[0].screenX; }
function handleTouchEnd(e) { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }
function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) showNextImage(); else showPrevImage();
    }
}
