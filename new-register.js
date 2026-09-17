/* ==========================================================================
   Custom on-site registration form — test page (new-register.html).
   POSTs directly to the Google Apps Script Web App, which appends a row to
   the same 2026 Google Sheet the official Google Form writes to. Column
   order here must keep matching registrations.js's YEARS[0].columns map.
   ========================================================================== */

// Deployed Apps Script Web App URL (Version 2, "Anyone" access, uses
// SpreadsheetApp.openById so it works from this standalone script project).
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtVYzVPbEaLj00my4lX5NvYNRRb1C9tex1uDwgCmUvQgTE-nh3H1Y6W4pTOfRLGRJ9/exec';

// Same 2026 Sheet the Apps Script writes to — used to double-check a
// submission actually landed, since Apps Script's own response can be flaky.
const SHEET_ID = '1L03eFqUeOBekB6IBmLlvfYjfFyyzYw-2CtbvwrA01r0';
const SHEET_GID = '308134922';
// Google's query API — lets us ask the sheet to filter server-side (by
// phone number) instead of downloading the whole sheet as CSV each check.
const SHEET_TQ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;

const PRICE_ADULT = 900;
const PRICE_KID_6_12 = 500;

function $(sel, ctx = document) { return ctx.querySelector(sel); }

function updateAmount() {
    const adults = Number($('#fAdults').value) || 0;
    const kids6to12 = Number($('#fKids6to12').value) || 0;
    const amount = adults * PRICE_ADULT + kids6to12 * PRICE_KID_6_12;
    $('#fAmountDisplay').textContent = `\u20b9${amount}`;
    return amount;
}

function setStatus(message, kind) {
    const el = $('#registerStatus');
    el.textContent = message;
    el.hidden = !message;
    el.className = 'register-status' + (kind ? ` is-${kind}` : '');
}

// percent === null hides the bar; otherwise shows it at that fill level.
function setProgress(percent) {
    const wrap = $('#registerProgress');
    const bar = $('#registerProgressBar');
    if (percent === null) {
        wrap.hidden = true;
        bar.style.width = '0%';
        return;
    }
    wrap.hidden = false;
    bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

/* ---------- Verify a submission actually landed in the Sheet ---------- */
// Queries only the Name + Phone columns (B, C) for an exact phone match,
// via Google's gviz query API — far lighter/faster than downloading the
// entire sheet as CSV on every check.
async function isRegisteredInSheet(name, phone) {
    const digits = phone.replace(/\D/g, '');
    const whereClause = digits ? `C = ${digits}` : `C = '${phone.replace(/'/g, "''")}'`;
    const query = `select B, C where ${whereClause}`;
    const url = `${SHEET_TQ_URL}?gid=${SHEET_GID}&headers=0&tq=${encodeURIComponent(query)}&_=${Date.now()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not read the sheet');
    const text = await res.text();
    const match = text.match(/setResponse\(([\s\S]*)\);?\s*$/);
    if (!match) throw new Error('Unexpected sheet response');
    const data = JSON.parse(match[1]);
    const rows = (data.table && data.table.rows) || [];
    const wantName = name.trim().toLowerCase();

    return rows.some(row => {
        const cell = row.c && row.c[0];
        const rowName = cell && cell.v != null ? String(cell.v).trim().toLowerCase() : '';
        return rowName === wantName;
    });
}

/* ---------- Generic dropdown with optional search + "Other" custom text ---------- */
function initOtherCapableDropdown({ selectId, triggerId, textId, menuId, optionsId, hiddenId,
    searchId, emptyId, otherInputId, otherValue, placeholder }) {
    const wrap = $(`#${selectId}`);
    if (!wrap) return null;

    const trigger = $(`#${triggerId}`);
    const triggerText = $(`#${textId}`);
    const menu = $(`#${menuId}`);
    const search = searchId ? $(`#${searchId}`) : null;
    const options = Array.from($(`#${optionsId}`).querySelectorAll('li[role="option"]'));
    const empty = emptyId ? $(`#${emptyId}`) : null;
    const hiddenInput = $(`#${hiddenId}`);
    const otherInput = otherInputId ? $(`#${otherInputId}`) : null;

    function openMenu() {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        if (search) {
            search.value = '';
            filterOptions('');
            search.focus();
        }
    }

    function closeMenu() {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
    }

    function filterOptions(query) {
        if (!search) return;
        const q = query.trim().toLowerCase();
        let anyVisible = false;
        options.forEach(li => {
            const match = li.dataset.value.toLowerCase().includes(q);
            li.hidden = !match;
            if (match) anyVisible = true;
        });
        if (empty) empty.hidden = anyVisible;
    }

    function selectValue(value) {
        options.forEach(li => li.setAttribute('aria-selected', String(li.dataset.value === value)));
        triggerText.textContent = value;
        triggerText.classList.add('has-value');

        if (otherInput && value === otherValue) {
            otherInput.hidden = false;
            hiddenInput.value = otherInput.value.trim();
            otherInput.focus();
        } else {
            if (otherInput) { otherInput.hidden = true; otherInput.value = ''; }
            hiddenInput.value = value;
        }
        closeMenu();
    }

    trigger.addEventListener('click', () => { if (menu.hidden) openMenu(); else closeMenu(); });

    if (search) {
        search.addEventListener('input', () => filterOptions(search.value));
        search.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu();
                trigger.focus();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                const firstVisible = options.find(li => !li.hidden);
                if (firstVisible) selectValue(firstVisible.dataset.value);
            }
        });
    }

    options.forEach(li => li.addEventListener('click', () => selectValue(li.dataset.value)));

    if (otherInput) {
        otherInput.addEventListener('input', () => { hiddenInput.value = otherInput.value.trim(); });
    }

    document.addEventListener('click', (event) => { if (!wrap.contains(event.target)) closeMenu(); });

    return {
        reset: () => {
            triggerText.textContent = placeholder;
            triggerText.classList.remove('has-value');
            options.forEach(li => li.removeAttribute('aria-selected'));
            if (otherInput) { otherInput.hidden = true; otherInput.value = ''; }
            hiddenInput.value = '';
            closeMenu();
        }
    };
}

/* ---------- Generic compact count dropdown (Adults / Kids fields) ---------- */
function initCountDropdown({ selectId, triggerId, textId, menuId, optionsId, hiddenId, defaultValue, onChange }) {
    const wrap = $(`#${selectId}`);
    if (!wrap) return null;

    const trigger = $(`#${triggerId}`);
    const triggerText = $(`#${textId}`);
    const menu = $(`#${menuId}`);
    const options = Array.from($(`#${optionsId}`).querySelectorAll('li[role="option"]'));
    const hiddenInput = $(`#${hiddenId}`);

    function openMenu() {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
    }
    function selectValue(value) {
        options.forEach(li => li.setAttribute('aria-selected', String(li.dataset.value === value)));
        triggerText.textContent = value;
        hiddenInput.value = value;
        closeMenu();
        if (onChange) onChange();
    }

    trigger.addEventListener('click', () => { if (menu.hidden) openMenu(); else closeMenu(); });
    options.forEach(li => li.addEventListener('click', () => selectValue(li.dataset.value)));
    document.addEventListener('click', (event) => { if (!wrap.contains(event.target)) closeMenu(); });

    return { reset: () => selectValue(defaultValue) };
}

/* ---------- Cultural program multi-select dropdown ---------- */
function initCulturalDropdown() {
    const wrap = $('#culturalSelect');
    if (!wrap) return null;

    const trigger = $('#culturalTrigger');
    const triggerText = $('#culturalTriggerText');
    const menu = $('#culturalMenu');
    const options = Array.from($('#culturalOptions').querySelectorAll('li[role="option"]'));
    const otherInput = $('#fCulturalOther');
    const othersOption = options.find(li => li.dataset.value === 'Others');
    const placeholder = 'Select options\u2026';

    function openMenu() { menu.hidden = false; trigger.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
    function updateTriggerText() {
        const selected = options.filter(li => li.getAttribute('aria-selected') === 'true');
        if (!selected.length) {
            triggerText.textContent = placeholder;
            triggerText.classList.remove('has-value');
            return;
        }
        triggerText.textContent = selected.map(li => li.dataset.value).join(', ');
        triggerText.classList.add('has-value');
    }
    function toggleOption(li) {
        const wasSelected = li.getAttribute('aria-selected') === 'true';
        li.setAttribute('aria-selected', String(!wasSelected));
        if (li === othersOption) {
            otherInput.hidden = wasSelected;
            if (!wasSelected) otherInput.focus();
            else otherInput.value = '';
        }
        updateTriggerText();
    }

    trigger.addEventListener('click', () => { if (menu.hidden) openMenu(); else closeMenu(); });
    options.forEach(li => li.addEventListener('click', () => toggleOption(li)));
    if (otherInput) otherInput.addEventListener('input', updateTriggerText);
    document.addEventListener('click', (event) => { if (!wrap.contains(event.target)) closeMenu(); });

    return {
        getValue: () => {
            const selected = options.filter(li => li.getAttribute('aria-selected') === 'true');
            return selected
                .map(li => li === othersOption ? (otherInput.value.trim() || 'Others') : li.dataset.value)
                .join(', ');
        },
        reset: () => {
            options.forEach(li => li.removeAttribute('aria-selected'));
            otherInput.hidden = true;
            otherInput.value = '';
            updateTriggerText();
            closeMenu();
        }
    };
}

/* ---------- Generic simple modal (open/close/focus-trap/Escape) ---------- */
function initSimpleModal(modalId, { closeSelector } = {}) {
    const box = $(`#${modalId}`);
    if (!box) return null;
    const closeBtn = closeSelector ? box.querySelector(closeSelector) : null;
    let lastFocused = null;

    function open() {
        lastFocused = document.activeElement;
        box.hidden = false;
        void box.offsetHeight; // force reflow so the opacity transition runs
        box.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        const focusTarget = closeBtn || box.querySelector('button');
        if (focusTarget) focusTarget.focus();
    }

    function close() {
        box.classList.remove('is-open');
        setTimeout(() => { box.hidden = true; }, 250);
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    box.addEventListener('click', (event) => { if (event.target === box) close(); });
    document.addEventListener('keydown', (event) => {
        if (box.hidden) return;
        if (event.key === 'Escape') close();
    });

    return { open, close };
}

function initRegisterForm() {
    const form = $('#registerForm');
    if (!form) return;

    const culturalDropdown = initCulturalDropdown();

    const adultsDropdown = initCountDropdown({
        selectId: 'adultsSelect', triggerId: 'adultsTrigger', textId: 'adultsTriggerText',
        menuId: 'adultsMenu', optionsId: 'adultsOptions', hiddenId: 'fAdults',
        defaultValue: '1', onChange: updateAmount
    });
    const kids6to12Dropdown = initCountDropdown({
        selectId: 'kids6to12Select', triggerId: 'kids6to12Trigger', textId: 'kids6to12TriggerText',
        menuId: 'kids6to12Menu', optionsId: 'kids6to12Options', hiddenId: 'fKids6to12',
        defaultValue: '0', onChange: updateAmount
    });
    const kidsUnder6Dropdown = initCountDropdown({
        selectId: 'kidsUnder6Select', triggerId: 'kidsUnder6Trigger', textId: 'kidsUnder6TriggerText',
        menuId: 'kidsUnder6Menu', optionsId: 'kidsUnder6Options', hiddenId: 'fKidsUnder6',
        defaultValue: '0'
    });

    updateAmount();
    const locationDropdown = initOtherCapableDropdown({
        selectId: 'locationSelect', triggerId: 'locationTrigger', textId: 'locationTriggerText',
        menuId: 'locationMenu', optionsId: 'locationOptions', hiddenId: 'fLocation',
        searchId: 'locationSearch', emptyId: 'locationEmpty',
        otherInputId: 'fLocationOther', otherValue: 'Others',
        placeholder: 'Select your area\u2026'
    });
    const transportDropdown = initOtherCapableDropdown({
        selectId: 'transportSelect', triggerId: 'transportTrigger', textId: 'transportTriggerText',
        menuId: 'transportMenu', optionsId: 'transportOptions', hiddenId: 'fTransport',
        otherInputId: 'fTransportOther', otherValue: 'Other',
        placeholder: 'Select an option\u2026'
    });

    const confirmModal = initSimpleModal('confirmModal');
    const qrPayModal = initSimpleModal('qrPayModal', { closeSelector: '#qrPayClose' });

    const confirmCancelBtn = $('#confirmCancelBtn');
    const confirmOkBtn = $('#confirmOkBtn');
    if (confirmCancelBtn && confirmModal) {
        confirmCancelBtn.addEventListener('click', () => confirmModal.close());
    }
    if (confirmOkBtn && confirmModal) {
        confirmOkBtn.addEventListener('click', () => {
            confirmModal.close();
            submitRegistration();
        });
    }

    // Copy UPI ID button inside the Pay Now popup.
    const copyBtn = $('#qrCopyBtn');
    const upiId = $('#qrUpiId');
    if (copyBtn && upiId) {
        copyBtn.addEventListener('click', async () => {
            const id = upiId.textContent.trim();
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(id);
                } else {
                    const range = document.createRange();
                    range.selectNodeContents(upiId);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    document.execCommand('copy');
                    selection.removeAllRanges();
                }
                copyBtn.classList.add('is-copied');
                copyBtn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied!';
            } catch (err) {
                copyBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Couldn\'t copy';
            }
            setTimeout(() => {
                copyBtn.classList.remove('is-copied');
                copyBtn.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i> Copy UPI ID';
            }, 2000);
        });
    }

    async function submitRegistration() {
        const name = $('#fName').value.trim();
        const phone = $('#fPhone').value.trim();
        const payload = {
            name,
            phone,
            adults: $('#fAdults').value || '0',
            kids6to12: $('#fKids6to12').value || '0',
            kidsUnder6: $('#fKidsUnder6').value || '0',
            location: $('#fLocation').value.trim(),
            transport: $('#fTransport').value.trim(),
            cultural: culturalDropdown ? culturalDropdown.getValue() : '',
            comment: $('#fComment').value.trim(),
            // Amount is shown on-page for the user's reference only — leave
            // the Sheet's Amount column blank on submit.
            amount: '',
            payment: ''
        };

        const submitBtn = $('#registerSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
        setStatus('', null);
        setProgress(10);

        // Fire the POST, but don't trust its response alone — Apps Script's
        // reply can be flaky (HTML error page, network drop) even when the
        // row saved fine. We treat the Sheet itself as the source of truth.
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                // text/plain avoids a CORS preflight OPTIONS request, which
                // Apps Script Web Apps don't handle.
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            // Ignore here; verified against the sheet below.
        }

        submitBtn.textContent = 'Verifying…';
        setProgress(20);

        const maxAttempts = 4;
        let confirmed = false;
        for (let attempt = 0; attempt < maxAttempts && !confirmed; attempt++) {
            if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
            try {
                confirmed = await isRegisteredInSheet(name, phone);
            } catch (err) {
                // Try again on the next attempt.
            }
            setProgress(20 + (attempt + 1) * (80 / maxAttempts));
        }
        setProgress(null);

        if (confirmed) {
            setStatus('Thank you! Your registration has been recorded.', 'success');
            form.reset();
            locationDropdown.reset();
            transportDropdown.reset();
            if (culturalDropdown) culturalDropdown.reset();
            adultsDropdown.reset();
            kids6to12Dropdown.reset();
            kidsUnder6Dropdown.reset();
            updateAmount();
            if (qrPayModal) qrPayModal.open();
        } else {
            setStatus('Some issue happened, please try again.', 'error');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = $('#fName').value.trim();
        const phone = $('#fPhone').value.trim();
        if (!name || !phone) {
            setStatus('Please fill in your name and phone number.', 'error');
            return;
        }
        if (/\d/.test(name)) {
            setStatus('Name cannot contain numbers.', 'error');
            return;
        }
        if (!/^\d+$/.test(phone)) {
            setStatus('Phone number cannot contain letters or symbols — digits only.', 'error');
            return;
        }
        if (phone.length !== 10) {
            setStatus('Phone number must be exactly 10 digits.', 'error');
            return;
        }

        setStatus('', null);
        if (confirmModal) confirmModal.open();
        else submitRegistration();
    });
}

document.addEventListener('DOMContentLoaded', initRegisterForm);
