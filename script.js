/* ==========================================================================
   Aghria Nuakhai Bhetghat — site behaviour
   Plain ES2020, no build step. Every DOM lookup is guarded so this file can
   also be loaded by registrations.html / public/stats.html without throwing.
   ========================================================================== */

/* ==========================================================================
   1. EVENT CONFIG — this is the only block organisers need to edit.
   ========================================================================== */
const EVENT = {
    edition: 'v3.1',
    year: 2026,

    /* `startsAt` drives the countdown. Use ISO 8601 with the +05:30 offset so
       the countdown is correct for visitors in any timezone. */
    startsAt: '2026-09-27T09:00:00+05:30',
    dateLabel: 'September 27, 2026 (Sunday)',
    timeLabel: '9:00 AM onwards',
    dateConfirmed: true,

    /* ⚠️  Venue not yet announced. Fill both fields and mapsUrl to switch the
       "Get Directions" buttons back on.
       For reference, 2025 was at: Backyard by FHC, Budigere Cross, Bengaluru
       — https://maps.app.goo.gl/KQAdKDqnDHQ5Ctdg9 */
    venue: {
        name: 'Bagini, Hoodi',
        area: 'Bengaluru',
        mapsUrl: 'https://maps.app.goo.gl/G4Es5rcgj2FGGqc27'
    },

    /* 2026 registration form.
       The 2025 form was:
       https://docs.google.com/forms/d/e/1FAIpQLSfqtsVtKRb94bVyvytIDkn-7v0f7uRozrYfo25eC_LeFeCEqw/viewform */
    registrationUrl: 'https://forms.gle/CYctdaxfAxMGBN7L6',

    /* Public visit counter (counterapi.dev). Set to null to remove it. */
    counter: {
        workspace: 'aghria-nuakhai-workspace',
        name: 'agharia-nuakhai-2026'
    }
};

/* Past editions, newest first.
   `photos` is the number of images named image1.jpg … imageN.jpg inside
   images/events/<year>/. To add a year: drop the files in that folder and add
   an entry here.
   TODO organisers: the descriptions below are deliberately plain — please
   replace them with what actually happened each year. */
const EVENT_HISTORY = [
    {
        year: 2026,
        label: 'Bhetghat v3.1',
        icon: 'fa-star',
        upcoming: true,
        photos: 0,
        description: 'The fourth edition. Details are being finalised — register to be counted in.'
    },
    {
        year: 2025,
        label: 'Bhetghat v3.0',
        icon: 'fa-people-group',
        photos: 5,
        description: 'Our third Bengaluru gathering, held at Backyard by FHC near Budigere Cross — dance, games, and a shared meal.'
    },
    {
        year: 2024,
        label: 'Bhetghat v2.0',
        icon: 'fa-drum',
        photos: 7,
        description: 'A full day of cultural performances, a traditional spread, and the largest turnout yet.'
    },
    {
        year: 2023,
        label: 'Bhetghat v1.0',
        icon: 'fa-utensils',
        photos: 5,
        description: 'The first Bhetghat under its own name, bringing the Bengaluru families together again.'
    },
    {
        year: 2022,
        label: 'Community meet',
        icon: 'fa-users',
        photos: 6,
        description: 'Back in person after the pandemic years, with rituals and greetings resumed in full.'
    },
    {
        year: 2019,
        label: 'Where it began',
        icon: 'fa-seedling',
        photos: 4,
        description: 'The first organised Aghria Nuakhai celebration in Bengaluru — the start of the tradition.'
    }
];

/* ==========================================================================
   2. Small helpers
   ========================================================================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setText = (selector, value) => {
    $$(selector).forEach(el => { el.textContent = value; });
};

/* ==========================================================================
   3. Populate event details from EVENT
   ========================================================================== */
function applyEventConfig() {
    setText('[data-edition]', EVENT.edition);
    setText('[data-event-year]', String(EVENT.year));
    setText('[data-event-date]', EVENT.dateLabel + (EVENT.dateConfirmed ? '' : ' — tentative'));
    setText('[data-event-time]', EVENT.timeLabel);
    setText('[data-event-venue]', EVENT.venue.name);
    setText('[data-event-area]', EVENT.venue.area);
    setText('[data-current-year]', String(new Date().getFullYear()));

    $$('[data-date-status]').forEach(el => { el.hidden = EVENT.dateConfirmed; });

    // Registration links
    const hasForm = Boolean(EVENT.registrationUrl);
    $$('[data-register-link]').forEach(link => {
        if (hasForm) {
            link.href = EVENT.registrationUrl;
            link.target = '_blank';
            link.rel = 'noopener';
            link.classList.remove('is-disabled');
            link.removeAttribute('aria-disabled');
        } else {
            link.href = '#details';
            link.classList.add('is-disabled');
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('title', 'The 2026 registration form is not open yet');
        }
    });
    setText('[data-register-label]', hasForm ? 'Register Now' : 'Registration opens soon');

    // Directions links
    const hasMap = Boolean(EVENT.venue.mapsUrl);
    $$('[data-directions-link]').forEach(link => {
        if (hasMap) {
            link.href = EVENT.venue.mapsUrl;
            link.target = '_blank';
            link.rel = 'noopener';
            link.classList.remove('is-disabled');
        } else {
            link.href = '#details';
            link.classList.add('is-disabled');
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('title', 'The venue has not been announced yet');
        }
    });
}

/* ==========================================================================
   4. Countdown
   ========================================================================== */
function initCountdown() {
    const root = $('#countdown');
    if (!root) return;

    const note = $('#countdownNote');
    const cells = {
        days: $('#cd-days'),
        hours: $('#cd-hours'),
        minutes: $('#cd-minutes'),
        seconds: $('#cd-seconds')
    };
    if (!cells.days) return;

    const start = new Date(EVENT.startsAt);
    if (Number.isNaN(start.getTime())) {
        console.warn('EVENT.startsAt is not a valid date:', EVENT.startsAt);
        return;
    }
    // The gathering runs most of the day; treat +10h as "still happening".
    const end = start.getTime() + 10 * 60 * 60 * 1000;

    const showNote = (text, state) => {
        root.classList.remove('is-live', 'is-done');
        if (state) root.classList.add(state);
        if (!note) return;
        note.textContent = text;
        note.hidden = !text;
    };

    const tick = () => {
        const remaining = start.getTime() - Date.now();

        if (remaining > 0) {
            const s = Math.floor(remaining / 1000);
            cells.days.textContent    = String(Math.floor(s / 86400)).padStart(2, '0');
            cells.hours.textContent   = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
            cells.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
            cells.seconds.textContent = String(s % 60).padStart(2, '0');
            showNote(EVENT.dateConfirmed ? '' : 'Date is tentative until organisers confirm it.', null);
            return true;
        }

        if (Date.now() < end) {
            showNote('🎉 Nuakhai Juhar — it\'s happening today!', 'is-live');
        } else {
            showNote('Bhetghat ' + EVENT.year + ' has wrapped up. Thank you for joining us.', 'is-done');
        }
        return false;
    };

    if (tick()) {
        const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
    }
}

/* ==========================================================================
   5. Memories timeline
   ========================================================================== */
function photoList(entry) {
    return Array.from({ length: entry.photos }, (_, i) => `images/events/${entry.year}/image${i + 1}.jpg`);
}

function renderTimeline() {
    const list = $('#timeline');
    if (!list) return;

    list.innerHTML = EVENT_HISTORY.map(entry => {
        const photos = photoList(entry);

        const photosHtml = photos.length
            ? `<div class="tl-photos">${photos.map((src, i) => `
                    <button type="button" class="tl-photo" data-year="${entry.year}" data-index="${i}"
                            aria-label="Open photo ${i + 1} of ${photos.length} from ${entry.year}">
                        <img src="${src}" alt="Bhetghat ${entry.year}, photo ${i + 1}" loading="lazy" decoding="async">
                    </button>`).join('')}</div>`
            : `<p class="tl-empty">${entry.upcoming ? 'Photos will appear here after the event.' : 'No photos archived for this year.'}</p>`;

        return `
        <li class="tl-entry reveal${entry.upcoming ? ' is-upcoming' : ''}">
            <div class="tl-marker"><i class="fas ${entry.icon}" aria-hidden="true"></i></div>
            <div class="tl-card">
                <p class="tl-year">${entry.year}<span class="tl-label">${entry.label}</span></p>
                <p class="tl-desc">${entry.description}</p>
                ${photosHtml}
            </div>
        </li>`;
    }).join('');
}

/* ==========================================================================
   6. Lightbox
   ========================================================================== */
function initLightbox() {
    const box = $('#lightbox');
    const img = $('#lbImage');
    if (!box || !img) return;

    const caption = $('#lbCaption');
    const prevBtn = $('#lbPrev');
    const nextBtn = $('#lbNext');
    const closeBtn = $('#lbClose');

    let photos = [];
    let index = 0;
    let year = '';
    let lastFocused = null;

    const paint = () => {
        img.src = photos[index];
        img.alt = `Bhetghat ${year}, photo ${index + 1} of ${photos.length}`;
        if (caption) caption.textContent = `${year} · ${index + 1} / ${photos.length}`;
        const multiple = photos.length > 1;
        if (prevBtn) prevBtn.hidden = !multiple;
        if (nextBtn) nextBtn.hidden = !multiple;
    };

    const open = (entryYear, startIndex) => {
        const entry = EVENT_HISTORY.find(e => String(e.year) === String(entryYear));
        if (!entry || !entry.photos) return;

        photos = photoList(entry);
        year = String(entry.year);
        index = Math.min(Math.max(startIndex, 0), photos.length - 1);
        lastFocused = document.activeElement;

        paint();
        box.hidden = false;
        void box.offsetHeight; // force a reflow so the opacity transition runs
        box.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (closeBtn) closeBtn.focus();
    };

    const close = () => {
        box.classList.remove('is-open');
        const finish = () => {
            box.hidden = true;
            img.src = '';
        };
        prefersReducedMotion ? finish() : setTimeout(finish, 250);
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    const step = delta => {
        if (photos.length < 2) return;
        index = (index + delta + photos.length) % photos.length;
        paint();
    };

    // Delegated so it keeps working after the timeline re-renders
    document.addEventListener('click', event => {
        const trigger = event.target.closest('.tl-photo');
        if (!trigger) return;
        open(trigger.dataset.year, Number(trigger.dataset.index));
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => step(1));
    box.addEventListener('click', event => { if (event.target === box) close(); });

    document.addEventListener('keydown', event => {
        if (box.hidden) return;
        if (event.key === 'Escape') close();
        else if (event.key === 'ArrowLeft') step(-1);
        else if (event.key === 'ArrowRight') step(1);
        else if (event.key === 'Tab') {
            // keep focus inside the dialog
            const focusable = [closeBtn, prevBtn, nextBtn].filter(el => el && !el.hidden);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first.focus();
            }
        }
    });

    // Swipe on touch devices
    let touchX = null;
    box.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
        touchX = null;
    }, { passive: true });
}

/* ==========================================================================
   7. Navigation
   ========================================================================== */
function initNav() {
    const bar = $('#navbar');
    const toggle = $('#navToggle');
    const menu = $('#navMenu');

    if (bar) {
        const onScroll = () => bar.classList.toggle('is-stuck', window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (!toggle || !menu) return;

    const setOpen = open => {
        menu.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after tapping a link, or on Escape
    menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
}

/* ==========================================================================
   8. Hero media — video with a slideshow fallback
   ========================================================================== */
function initHeroMedia() {
    const video = $('#heroVideo');
    const slides = $('#heroSlides');
    const slideEls = slides ? $$('.hero-slide', slides) : [];

    let slideTimer = null;
    let switchedToPhotos = false;

    const startSlideshow = () => {
        if (slideTimer || slideEls.length < 2 || prefersReducedMotion) return;
        let current = 0;
        slideTimer = setInterval(() => {
            slideEls[current].classList.remove('is-active');
            current = (current + 1) % slideEls.length;
            slideEls[current].classList.add('is-active');
        }, 1000);
    };

    // The deliberate handoff: video plays first, in full, then we crossfade
    // over to the photo slideshow for the rest of the visit. No fixed timer —
    // this fires on the video's own 'ended' event, so it always plays through
    // completely regardless of its length or playback rate.
    const switchToPhotos = () => {
        if (switchedToPhotos) return;
        switchedToPhotos = true;
        if (video) video.classList.remove('is-ready'); // fades out via its own opacity transition
        if (slides) slides.classList.remove('is-hidden'); // fades in via its own opacity transition
        startSlideshow();
        // Stop decoding a video nobody can see anymore, once its fade-out finishes
        if (video) setTimeout(() => video.pause(), 850);
    };

    const useFallback = () => {
        if (video) video.style.display = 'none';
        switchToPhotos();
    };

    if (!video) { useFallback(); return; }

    video.playbackRate = 0.75; // slightly slowed, for a calmer background

    video.addEventListener('loadeddata', () => {
        video.classList.add('is-ready');
        if (slides) slides.classList.add('is-hidden');
    });
    // Reduced-motion visitors would rather the background stay still, so
    // skip the handoff for them entirely — the video (now static-looking,
    // since it's not actually forced to pause) stays as the backdrop.
    if (!prefersReducedMotion) {
        video.addEventListener('ended', switchToPhotos);
    }
    video.addEventListener('error', useFallback);

    // Autoplay is blocked in some browsers / on Low Power Mode
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => useFallback());
    }

    // Don't burn battery on a video nobody can see
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) video.pause();
        else if (!switchedToPhotos) video.play().catch(() => {});
    });
}

/* ==========================================================================
   9. Scroll reveal
   ========================================================================== */
function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(el => observer.observe(el));
}

/* ==========================================================================
   10. Visit counter
   ========================================================================== */
async function initVisitCounter() {
    const target = $('#website-visits');
    if (!target || !EVENT.counter) return;

    const base = `https://api.counterapi.dev/v2/${EVENT.counter.workspace}/${EVENT.counter.name}`;
    const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);

    try {
        // Only increment on the real site, so local development doesn't inflate it
        const res = await fetch(isLocal ? base : `${base}/up`);
        if (!res.ok) throw new Error(`counter responded ${res.status}`);
        const payload = await res.json();
        const count = payload?.data?.up_count;
        target.textContent = typeof count === 'number' ? count.toLocaleString('en-IN') : '—';
    } catch (error) {
        console.warn('Visit counter unavailable:', error.message);
        const wrapper = target.closest('.visits');
        if (wrapper) wrapper.hidden = true;
    }
}

/* ==========================================================================
   11. Boot
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    applyEventConfig();
    initNav();
    initHeroMedia();
    initCountdown();
    renderTimeline();
    initLightbox();
    initReveal();
    initVisitCounter();
});
