/* ==========================================================================
   Participant map — aggregates a registration sheet by "Coming From" and
   plots it on a free OpenStreetMap/Leaflet map. No backend, no database,
   no stored lat/lng, no API key, no billing.

   Same three years' sheets as registrations.js, same column quirks per
   year (see the comment on YEARS below) — kept in sync with that file
   since they read the same underlying data.

   HOW IT WORKS
   1. Fetch the selected year's public Google Sheet CSV.
   2. Group rows by the "Coming From" column, summing adults/kids per group.
   3. Turn each unique location into "<location>, Bangalore, India" and
      geocode it via Nominatim (OpenStreetMap's free geocoder) — this runs
      entirely in the browser, no server involved.
   4. Cache each geocode result in localStorage so repeat visits don't
      re-query Nominatim (their usage policy is ~1 request/second and asks
      that cacheable results be cached).
   5. Plot a marker per location sized/labelled with its participant total.

   NOTE — Google Maps was tried and reverted: the Maps JavaScript API works
   fine key-only, but the Geocoding API requires a billing account attached
   to the Cloud project even to stay within the free credit. Not worth that
   for a no-backend community site, so this stays on the free stack above.
   ========================================================================== */

const YEARS = [
    {
        year: 2026,
        label: '2026 — Live',
        current: true,
        sheetId: '1L03eFqUeOBekB6IBmLlvfYjfFyyzYw-2CtbvwrA01r0',
        gid: '308134922',
        columns: { name: 1, adults: 3, kids6to12: 4, kidsBelow6: 5, location: 6 }
    },
    {
        year: 2025,
        label: '2025 — Archive',
        current: false,
        sheetId: '1VuxB1QHP4yKCHcefYVGWHnczekJ23ys_Xt-XkB61bfM',
        gid: '1157074278',
        columns: { name: 2, adults: 4, kids6to12: 5, kidsBelow6: 6, location: 7 }
    },
    {
        // The 2019 sheet predates the "kids 6-12" split — only has one kids
        // column (kept in kidsBelow6 for simplicity, since that's the only
        // one that exists). columns entries left `null` mean "no such
        // field", read as blank rather than misreading an unrelated column.
        year: 2019,
        label: '2019 — Archive',
        current: false,
        sheetId: '1WCf507SuNQCb8B1pXZgXhx61qK3xCv-QUF6G49--BBQ',
        gid: '0',
        columns: { name: 0, adults: 2, kids6to12: null, kidsBelow6: 3, location: 4 }
    }
];

const GEOCODE_CACHE_PREFIX = 'nuakhai-geocode:';
const NOMINATIM_DELAY_MS = 1100; // stay under Nominatim's ~1 req/sec fair-use limit
const BENGALURU_CENTER = [12.9716, 77.5946];

let activeYear = YEARS.find(y => y.current) || YEARS[0];
let map = null;
let markersLayer = null;

document.addEventListener('DOMContentLoaded', () => {
    initYearSwitcher();
    loadYear(activeYear);
});

function initYearSwitcher() {
    const select = document.getElementById('mapYearSelect');
    if (!select) return;

    select.innerHTML = YEARS.map(y => `<option value="${y.year}">${y.label}</option>`).join('');
    select.value = activeYear.year;

    select.addEventListener('change', () => {
        const chosen = YEARS.find(y => String(y.year) === select.value);
        if (!chosen) return;
        activeYear = chosen;
        loadYear(activeYear);
    });
}

async function loadYear(year) {
    const statusEl = document.getElementById('mapStatus');
    statusEl.hidden = false;
    statusEl.textContent = `Loading ${year.year} registrations…`;

    try {
        const rows = await fetchSheetRows(year);
        const { locations, familyCount } = aggregateByLocation(rows, year);
        renderDashboard(locations, familyCount);
        renderLocationTable(locations);

        if (locations.length === 0) {
            statusEl.textContent = `No ${year.year} registrations with a "Coming From" location yet.`;
            if (markersLayer) markersLayer.clearLayers();
            return;
        }

        if (!map) map = initMap();
        statusEl.textContent = `Placing ${locations.length} location${locations.length === 1 ? '' : 's'} on the map…`;
        const { failed } = await plotLocations(map, locations);
        if (failed.length) {
            console.warn('Could not geocode:', failed.join(', '));
            statusEl.hidden = false;
            statusEl.textContent = `Placed ${locations.length - failed.length} of ${locations.length} locations. ` +
                `Couldn't find on the map: ${failed.join(', ')} (still listed in the table below).`;
        } else {
            statusEl.hidden = true;
        }
    } catch (error) {
        console.error(`Participant map failed to load ${year.year}:`, error);
        statusEl.hidden = false;
        statusEl.textContent = `Couldn't load the map: ${error.message}`;
    }
}

/* ---------- 1 & 2. Fetch + aggregate ---------- */

async function fetchSheetRows(year) {
    const url = `https://docs.google.com/spreadsheets/d/${year.sheetId}/export?format=csv&gid=${year.gid}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch registration data from Google Sheets.');
    const csvText = await response.text();
    return parseCSV(csvText).slice(1); // drop header row
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
                if (inQuotes && line[i + 1] === '"') { cell += '"'; i++; }
                else inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) { row.push(cell); cell = ''; }
            else cell += char;
        }
        row.push(cell);
        return row.map(c => c.trim().replace(/^"|"$/g, ''));
    });
}

// Groups rows by "Coming From", summing adults/kids per group. Skips
// spreadsheet footer/summary rows (a real issue seen on the 2019 sheet)
// by requiring a real name AND a real adult count. Returns both the
// per-location breakdown and the count of valid family rows.
function aggregateByLocation(rows, year) {
    const c = year.columns;
    // A `null` column index means this year's sheet has no such field.
    const cell = (row, index) => (index == null ? '' : (row[index] || ''));

    const byLocation = new Map(); // key: lowercased/trimmed location -> { location, adults, kids6to12, kidsBelow6, names }
    let familyCount = 0;

    for (const row of rows) {
        const name = cell(row, c.name).trim();
        const adults = parseInt(cell(row, c.adults), 10) || 0;
        const location = cell(row, c.location).trim();
        if (!name || adults < 1 || !location) continue; // not a real registration row

        familyCount++;
        const key = location.toLowerCase();
        const entry = byLocation.get(key) || { location, adults: 0, kids6to12: 0, kidsBelow6: 0, names: [] };
        entry.adults += adults;
        entry.kids6to12 += parseInt(cell(row, c.kids6to12), 10) || 0;
        entry.kidsBelow6 += parseInt(cell(row, c.kidsBelow6), 10) || 0;
        entry.names.push(name);
        byLocation.set(key, entry);
    }

    const locations = [...byLocation.values()]
        .map(entry => ({ ...entry, total: entry.adults + entry.kids6to12 + entry.kidsBelow6 }))
        .sort((a, b) => b.total - a.total);

    return { locations, familyCount };
}

/* ---------- Dashboard + table ---------- */

function renderDashboard(locations, familyCount) {
    const totalParticipants = locations.reduce((sum, l) => sum + l.total, 0);
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('map-total-participants', totalParticipants.toLocaleString('en-IN'));
    setText('map-unique-locations', locations.length);
    setText('map-total-families', familyCount);
}

function renderLocationTable(locations) {
    const tbody = document.getElementById('mapLocationTable');
    if (!tbody) return;
    if (locations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No data yet</td></tr>';
        return;
    }
    tbody.innerHTML = locations.map(l => `
        <tr>
            <td>${escapeHtml(l.location)}</td>
            <td>${l.adults}</td>
            <td>${l.kids6to12}</td>
            <td>${l.kidsBelow6}</td>
            <td><strong>${l.total}</strong></td>
        </tr>`).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ---------- 3 & 4. Geocoding (Nominatim, cached) ---------- */

function geocodeCacheGet(query) {
    try {
        const raw = localStorage.getItem(GEOCODE_CACHE_PREFIX + query);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function geocodeCacheSet(query, coords) {
    try { localStorage.setItem(GEOCODE_CACHE_PREFIX + query, JSON.stringify(coords)); }
    catch { /* localStorage unavailable (private mode, quota) — safe to skip caching */ }
}

// Resolves "<location>, Bangalore, India" to {lat, lon} using Nominatim.
// Returns null (rather than throwing) if the place can't be found, so one
// bad location name doesn't break the rest of the map.
async function geocodeViaNominatim(query) {
    const cached = geocodeCacheGet(query);
    if (cached) return cached;

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const results = await response.json();
    if (!results.length) return null;

    const coords = { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
    geocodeCacheSet(query, coords);
    return coords;
}

/* ---------- 5. Map rendering (Leaflet + Esri Light Gray Canvas) ---------- */

function initMap() {
    const leafletMap = L.map('bengaluruMap').setView(BENGALURU_CENTER, 11);
    // Esri's Light Gray Canvas — a flat, near-desaturated basemap. Free,
    // no API key, no billing — verified working with no watermark (unlike
    // CARTO's raster basemaps, which now show an "API key required"
    // watermark). The "Reference" layer is a second, separate tile set
    // that adds just the place-name labels back on top of the plain canvas.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
        maxZoom: 16
    }).addTo(leafletMap);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16
    }).addTo(leafletMap);

    markersLayer = L.layerGroup().addTo(leafletMap);

    // Leaflet measures its container at init time; if a layout reflow
    // happens afterward (e.g. a web font swapping in and reshuffling the
    // page), that measurement goes stale and part of the map is left
    // blank/untiled. Re-measure once shortly after load and on resize.
    setTimeout(() => leafletMap.invalidateSize(), 300);
    window.addEventListener('resize', () => leafletMap.invalidateSize());

    return leafletMap;
}

// A round badge-style marker showing the participant count, coloured to
// match the site's blue-teal accent (see .map-count-marker in styles.css).
function makeCountIcon(total) {
    const size = total >= 10 ? 44 : 34;
    return L.divIcon({
        className: 'map-count-marker',
        html: `<span>${total}</span>`,
        iconSize: [size, size]
    });
}

// Fixes for location names that don't geocode as typed in the sheet —
// usually a misspelling of a real place. Matched case-insensitively;
// the corrected spelling is used only for the map lookup, not the table.
const LOCATION_ALIASES = {
    'seegahalli': 'Seegehalli'
};

async function plotLocations(leafletMap, locations) {
    markersLayer.clearLayers(); // switching years replaces markers, doesn't stack them

    const bounds = [];
    let placed = 0;
    let failed = [];

    for (const loc of locations) {
        const resolvedName = LOCATION_ALIASES[loc.location.toLowerCase()] || loc.location;
        const query = `${resolvedName}, Bangalore, India`;
        const wasCached = Boolean(geocodeCacheGet(query));
        const coords = await geocodeViaNominatim(query);

        if (coords) {
            const marker = L.marker([coords.lat, coords.lon], { icon: makeCountIcon(loc.total) }).addTo(markersLayer);
            const namesList = loc.names.map(n => `<li>${escapeHtml(n)}</li>`).join('');
            marker.bindPopup(`
                <strong>${escapeHtml(loc.location)}</strong><br>
                Adults: ${loc.adults}<br>
                Kids (6-12): ${loc.kids6to12}<br>
                Kids (&lt;6): ${loc.kidsBelow6}<br>
                <strong>Total: ${loc.total}</strong>
                <ul class="popup-names">${namesList}</ul>
            `);
            // Hover, not permanent — with several markers this close
            // together, always-on labels overlap each other and the
            // popup. The name is still shown on hover, and again in the
            // popup on click.
            marker.bindTooltip(escapeHtml(loc.location), {
                direction: 'top',
                className: 'map-place-label',
                offset: [0, -6]
            });
            bounds.push([coords.lat, coords.lon]);
            placed++;
        } else {
            failed.push(loc.location);
        }

        // Only throttle real network calls — cached lookups can run instantly
        if (!wasCached) await sleep(NOMINATIM_DELAY_MS);
    }

    if (bounds.length) {
        leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        leafletMap.invalidateSize();
    }

    return { placed, failed };
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
