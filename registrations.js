document.addEventListener('DOMContentLoaded', () => {
    if (window.location.protocol === 'file:') {
        showErrorMessage(
            'This page must be viewed on a web server.',
            'Opening this HTML file directly in the browser is blocked by security policies. Please use a local server to see the content.'
        );
        document.getElementById('refreshBtn').disabled = true;
        return;
    }
    initializePage();
});

async function initializePage() {
    await fetchRegistrationData();
}

// Google Sheets API configuration
const SHEET_ID = '1VuxB1QHP4yKCHcefYVGWHnczekJ23ys_Xt-XkB61bfM';
const GID = '1157074278';

// --- Registration Data Functions ---

let registrationData = [];

async function fetchRegistrationData() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data from Google Sheets. Check Sheet ID, GID, and share permissions.');
        const csvText = await response.text();
        const data = parseCSV(csvText);
        const rows = data.slice(1);
        registrationData = rows.map(row => ({
            name: row[2] || '',
            phone: row[3] || '',
            adults: parseInt(row[4]) || 0,
            kids_5_10: parseInt(row[5]) || 0,
            kids_under_5: parseInt(row[6]) || 0,
            location: row[7] || '',
            transport: row[8] || '',
            cultural: row[9] || '',
            payment: row[11] || ''
        }));
        updateRegistrationTable();
        updateStats();
    } catch (error) {
        console.error('Error fetching registration data:', error);
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
        const paymentCell = row.payment && row.payment.trim().toLowerCase() === 'done'
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

    // NOTE: Prices are assumed. Please update if they are different.
    const adultPrice = 999;
    const kidPrice = 499;

    const totalCollection = registrationData.reduce((sum, row) => {
        if (row.payment && row.payment.trim().toLowerCase() === 'done') {
            const adults = row.adults || 0;
            const kids = row.kids_5_10 || 0;
            return sum + (adults * adultPrice) + (kids * kidPrice);
        }
        return sum;
    }, 0);

    const unpaidFamilies = registrationData.filter(row => !row.payment || row.payment.trim().toLowerCase() !== 'done').length;

    document.getElementById('total-families').textContent = totalFamilies;
    document.getElementById('total-adults').textContent = totalAdults;
    document.getElementById('total-kids-5-10').textContent = totalKids5to10;
    document.getElementById('total-kids-under-5').textContent = totalKidsUnder5;
    document.getElementById('total-collection').textContent = `₹${totalCollection.toLocaleString()}`;
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