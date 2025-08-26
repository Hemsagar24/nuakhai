document.addEventListener('DOMContentLoaded', () => {
    const passwordPrompt = document.getElementById('password-prompt');
    const mainContent = document.getElementById('main-content');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');

    const correctPassword = '00000';

    function checkPassword() {
        if (passwordInput.value === correctPassword) {
            passwordPrompt.style.display = 'none';
            mainContent.style.display = 'block';
            initializePage();
        } else {
            passwordError.textContent = 'Incorrect password. Please try again.';
            passwordInput.focus();
        }
    }

    passwordSubmit.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });
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
            cultural: row[9] || ''
        }));
        updateRegistrationTable();
        updateStats();
    } catch (error) {
        console.error('Error fetching registration data:', error);
        showErrorMessage(error.message);
    }
}

function parseCSV(csvText) {
    return csvText.split('\n').map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
}

function showErrorMessage(message) {
    const tableBody = document.getElementById('registrationData');
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="loading" style="color: #e74c3c;">
                <i class="fas fa-exclamation-triangle"></i> 
                ${message}
            </td>
        </tr>
    `;
    document.getElementById('total-families').textContent = '0';
    document.getElementById('total-adults').textContent = '0';
    document.getElementById('total-kids').textContent = '0';
}

function updateRegistrationTable() {
    const tableBody = document.getElementById('registrationData');
    const filteredData = filterData();
    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="loading">No registrations found</td></tr>';
        return;
    }
    tableBody.innerHTML = filteredData.map((row, index) => `
        <tr>
            <td>${index + 1}</td><td>${row.name}</td><td>${row.phone}</td><td>${row.adults}</td><td>${row.kids_5_10}</td><td>${row.kids_under_5}</td><td>${row.location}</td><td>${row.transport}</td><td>${row.cultural}</td>
        </tr>`).join('');
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
    const totalKids = registrationData.reduce((sum, row) => sum + (row.kids_5_10 || 0) + (row.kids_under_5 || 0), 0);
    document.getElementById('total-families').textContent = totalFamilies;
    document.getElementById('total-adults').textContent = totalAdults;
    document.getElementById('total-kids').textContent = totalKids;
}

document.getElementById('searchInput').addEventListener('input', updateRegistrationTable);
document.getElementById('refreshBtn').addEventListener('click', () => {
    const refreshButton = document.getElementById('refreshBtn');
    refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    fetchRegistrationData().finally(() => {
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    });
});
