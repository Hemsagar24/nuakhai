/* ==========================================================================
   Registrations page — reads the organisers' Google Sheet as CSV.
   Two years' sheets are wired in below; each year has its own column
   layout (the 2025 sheet has an extra "Email Address" column the 2026
   one doesn't), so columns are mapped per year rather than by fixed index.
   ========================================================================== */

const YEARS = [
    {
        year: 2026,
        label: '2026 — Live',
        current: true,
        sheetId: '1L03eFqUeOBekB6IBmLlvfYjfFyyzYw-2CtbvwrA01r0',
        gid: '308134922',
        columns: {
            name: 1, phone: 2, adults: 3, kids5to10: 4, kidsUnder5: 5,
            location: 6, transport: 7, cultural: 8, amount: 10, payment: 11
        }
    },
    {
        year: 2025,
        label: '2025 — Archive',
        current: false,
        sheetId: '1VuxB1QHP4yKCHcefYVGWHnczekJ23ys_Xt-XkB61bfM',
        gid: '1157074278',
        columns: {
            name: 2, phone: 3, adults: 4, kids5to10: 5, kidsUnder5: 6,
            location: 7, transport: 8, cultural: 9, amount: 14, payment: 12
        }
    },
    {
        // The 2019 sheet predates most of the later columns: no "kids 6-12"
        // split, no transport/cultural-program fields, and it marks payment
        // as "Paid" rather than "Done" (see paidValue below). Columns that
        // don't exist for this year are left `null` — the row builder below
        // treats a null/undefined index as "no data" rather than guessing.
        year: 2019,
        label: '2019 — Archive',
        current: false,
        sheetId: '1WCf507SuNQCb8B1pXZgXhx61qK3xCv-QUF6G49--BBQ',
        gid: '0',
        paidValue: 'paid',
        columns: {
            name: 0, phone: 1, adults: 2, kids5to10: null, kidsUnder5: 3,
            location: 4, transport: null, cultural: null, amount: 7, payment: 6
        }
    }
];

let registrationData = [];
let activeYear = YEARS.find(y => y.current) || YEARS[0];

/* ==========================================================================
   Password gate.
   IMPORTANT: this is a soft deterrent, not real access control. Anyone can
   view this file's source and read PASSWORD_HASH, and the Google Sheet URLs
   it's "protecting" are fetched as plain public CSV anyway (see YEARS
   above) — so this only stops casual visitors from landing on the page by
   accident. It does not secure the underlying data.

   The password itself is never stored — only its SHA-256 hash, so reading
   this file tells you the hash, not the password. Change the password by
   computing a new hash, e.g. in a browser console:
     crypto.subtle.digest('SHA-256', new TextEncoder().encode('newpassword'))
       .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
   ========================================================================== */
const PASSWORD_HASH = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'; // sha256("hello")
const UNLOCK_KEY = 'nuakhai-registrations-unlocked';

async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function showRegistrationsPage() {
    document.getElementById('passwordGate').hidden = true;
    document.getElementById('main-content').hidden = false;
    initRegistrationsPage();
}

function initPasswordGate() {
    // Unlocking only persists for this browser tab session, not forever —
    // sessionStorage clears when the tab/browser closes.
    if (sessionStorage.getItem(UNLOCK_KEY) === '1') {
        showRegistrationsPage();
        return;
    }

    const form = document.getElementById('passwordForm');
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hash = await sha256Hex(input.value);
        if (hash === PASSWORD_HASH) {
            sessionStorage.setItem(UNLOCK_KEY, '1');
            showRegistrationsPage();
        } else {
            error.hidden = false;
            input.value = '';
            input.classList.remove('is-shaking');
            void input.offsetWidth; // restart the animation on repeat wrong guesses
            input.classList.add('is-shaking');
            input.focus();
        }
    });
}

document.addEventListener('DOMContentLoaded', initPasswordGate);

// Runs only after the correct password is entered (or an already-unlocked
// session reloads the page) — everything that used to run unconditionally.
function initRegistrationsPage() {
    if (window.location.protocol === 'file:') {
        showErrorMessage(
            'This page must be viewed on a web server.',
            'Opening this HTML file directly in the browser is blocked by security policies. Please use a local server to see the content.'
        );
        document.getElementById('refreshBtn').disabled = true;
        return;
    }
    initYearSwitcher();
    updateSheetLink();
    fetchRegistrationData();
}

function initYearSwitcher() {
    const select = document.getElementById('yearSelect');
    if (!select) return;

    select.innerHTML = YEARS.map(y =>
        `<option value="${y.year}">${y.label}</option>`
    ).join('');
    select.value = activeYear.year;

    select.addEventListener('change', () => {
        const chosen = YEARS.find(y => String(y.year) === select.value);
        if (!chosen) return;
        activeYear = chosen;
        updateSheetLink();
        fetchRegistrationData();
    });
}

// Most years mark a paid row as "Done"; 2019 used the word "Paid" instead.
// Each year's `paidValue` (default "done") says which word to match.
function isPaid(row) {
    const expected = (activeYear.paidValue || 'done').toLowerCase();
    return Boolean(row.payment) && row.payment.trim().toLowerCase() === expected;
}

// Keeps the nav's "Google Sheet" link pointed at whichever year is selected
function updateSheetLink() {
    const link = document.getElementById('sheetLink');
    if (!link) return;
    const { sheetId, gid, year } = activeYear;
    link.href = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?gid=${gid}#gid=${gid}`;
    link.textContent = `Google Sheet (${year})`;
}

async function fetchRegistrationData() {
    const year = activeYear;
    try {
        const url = `https://docs.google.com/spreadsheets/d/${year.sheetId}/export?format=csv&gid=${year.gid}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data from Google Sheets. Check Sheet ID, GID, and share permissions.');
        const csvText = await response.text();
        const data = parseCSV(csvText);
        const c = year.columns;
        // A `null` column index means this year's sheet has no such field —
        // read it as blank/zero rather than misreading an unrelated column.
        const cell = (row, index) => (index == null ? '' : (row[index] || ''));
        // Sheets sometimes carry footer rows in the data range itself — e.g.
        // "Total" / "Number of Paid People" / "Balance this year" summary
        // rows found in the 2019 sheet. A phone-number check would wrongly
        // drop real families who just left phone blank, so instead require
        // what every real registration actually has: a name, and an adult
        // count that parses as a real number ≥ 1 (the summary rows fail one
        // or the other — e.g. "Total" has no name, "Balance this year..."
        // has no adult count).
        const looksLikeRealRow = row =>
            cell(row, c.name).trim() !== '' && (parseInt(cell(row, c.adults), 10) || 0) >= 1;
        const rows = data.slice(1).filter(looksLikeRealRow);
        registrationData = rows.map(row => ({
            name: cell(row, c.name),
            phone: cell(row, c.phone),
            adults: parseInt(cell(row, c.adults)) || 0,
            kids_5_10: parseInt(cell(row, c.kids5to10)) || 0,
            kids_under_5: parseInt(cell(row, c.kidsUnder5)) || 0,
            location: cell(row, c.location),
            transport: cell(row, c.transport),
            cultural: cell(row, c.cultural),
            amount: parseInt(cell(row, c.amount)) || 0,
            payment: cell(row, c.payment)
        }));
        updateRegistrationTable();
        updateStats();
    } catch (error) {
        console.error(`Error fetching ${year.year} registration data:`, error);
        showErrorMessage(error.message);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    return lines.map(line => {
        if (!line) return [];
        const row = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(cell);
                cell = '';
            } else {
                cell += char;
            }
        }
        row.push(cell);
        return row.map(c => c.trim().replace(/^"|"$/g, ''));
    });
}

function showErrorMessage(message, details = '') {
    const tableBody = document.getElementById('registrationData');
    tableBody.innerHTML = `
        <tr>
            <td colspan="10" class="loading" style="color: #e74c3c;">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Error:</strong> ${message}
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${details}</p>
            </td>
        </tr>
    `;
    document.getElementById('total-families').textContent = 'Error';
    document.getElementById('total-adults').textContent = 'Error';
    document.getElementById('total-kids-5-10').textContent = 'Error';
    document.getElementById('total-kids-under-5').textContent = 'Error';
    document.getElementById('total-collection').textContent = 'Error';
    document.getElementById('unpaid-families').textContent = 'Error';
}

function updateRegistrationTable() {
    const tableBody = document.getElementById('registrationData');
    const filteredData = filterData();
    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="loading">No registrations found</td></tr>';
        return;
    }
    tableBody.innerHTML = filteredData.map((row, index) => {
        const paymentCell = isPaid(row)
            ? '<td class="payment-done"><i class="fas fa-check-circle"></i></td>'
            : '<td></td>';

        const culturalPrograms = row.cultural
            ? row.cultural.split(',').map(program => `<span class="cultural-tag">${program.trim()}</span>`).join(',&nbsp;')
            : '';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${row.name}</td>
                <td>${row.phone}</td>
                <td>${row.adults}</td>
                <td>${row.kids_5_10}</td>
                <td>${row.kids_under_5}</td>
                <td>${row.location}</td>
                <td>${row.transport}</td>
                <td class="cultural-cell">${culturalPrograms}</td>
                ${paymentCell}
            </tr>`;
    }).join('');
}

function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    return !searchTerm ? registrationData : registrationData.filter(row => 
        (row.name && row.name.toLowerCase().includes(searchTerm)) ||
        (row.phone && row.phone.includes(searchTerm)) ||
        (row.location && row.location.toLowerCase().includes(searchTerm))
    );
}

function updateStats() {
    const totalFamilies = registrationData.length;
    const totalAdults = registrationData.reduce((sum, row) => sum + (row.adults || 0), 0);
    const totalKids5to10 = registrationData.reduce((sum, row) => sum + (row.kids_5_10 || 0), 0);
    const totalKidsUnder5 = registrationData.reduce((sum, row) => sum + (row.kids_under_5 || 0), 0);

    // Collection is the sheet's own recorded "Amount" per row (not an assumed
    // price), summed only for rows marked as paid (see isPaid()).
    const totalCollection = registrationData.reduce((sum, row) =>
        isPaid(row) ? sum + (row.amount || 0) : sum, 0);

    const unpaidFamilies = registrationData.filter(row => !isPaid(row)).length;

    document.getElementById('total-families').textContent = totalFamilies;
    document.getElementById('total-adults').textContent = totalAdults;
    document.getElementById('total-kids-5-10').textContent = totalKids5to10;
    document.getElementById('total-kids-under-5').textContent = totalKidsUnder5;
    document.getElementById('total-collection').textContent = `₹${totalCollection.toLocaleString('en-IN')}`;
    document.getElementById('unpaid-families').textContent = unpaidFamilies;
}

document.getElementById('searchInput').addEventListener('input', updateRegistrationTable);
document.getElementById('refreshBtn').addEventListener('click', () => {
    const refreshButton = document.getElementById('refreshBtn');
    refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    fetchRegistrationData().finally(() => {
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    });
});
