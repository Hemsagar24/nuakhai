// Google Sheets API configuration
const SHEET_ID = '1VuxB1QHP4yKCHcefYVGWHnczekJ23ys_Xt-XkB61bfM';
const SHEET_NAME = 'Form_Responses'; // Update this if your sheet name is different
const API_KEY = 'YOUR_API_KEY'; // You'll need to get this from Google Cloud

// Base configuration for the timeline
const timelineConfig = [
    {
        year: '2024',
        icon: 'fa-calendar-alt',
        description: 'Grand celebration with 150+ families. Cultural performances, traditional food, and community bonding made it memorable.',
        images: []
    },
    {
        year: '2023',
        icon: 'fa-users',
        description: 'Post-pandemic reunion brought tears of joy. Traditional rituals resumed with great enthusiasm and community spirit.',
        images: []
    },
    {
        year: '2022',
        icon: 'fa-laptop',
        description: 'First virtual celebration during COVID-19. Online cultural programs connected families across Bangalore safely.',
        images: []
    },
    {
        year: '2021',
        icon: 'fa-heart',
        description: 'Small gathering with safety protocols. The spirit of Nuakhai remained strong despite pandemic challenges.',
        images: []
    },
    {
        year: '2020',
        icon: 'fa-star',
        description: 'Last grand in-person celebration before pandemic. Record attendance with vibrant cultural programs and community feast.',
        images: []
    },
    {
        year: '2019',
        icon: 'fa-seedling',
        description: 'The beginning of our annual tradition in Bangalore. First organized Aghria Nuakhai celebration that started it all.',
        images: []
    }
];

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize everything
    await initializePage();
});

async function initializePage() {
    // Setup animations
    const elementsToAnimate = document.querySelectorAll('.section-header, .feature-card, .timeline-content-item, .stat-card, .contact-card');
    elementsToAnimate.forEach(element => element.classList.add('animate-on-scroll'));
    animateOnScroll();

    // Start fetching registration data
    fetchRegistrationData();

    // Setup hero slideshow
    initHeroSlideshow();

    // Dynamically build and load the timeline
    await buildAndLoadTimeline();

    // Initialize photo modal after timeline is built
    initPhotoModal();

    // Initialize countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Checks if an image exists at a given URL
function checkImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// Dynamically builds timeline data and then renders the timeline
async function buildAndLoadTimeline() {
    const imageCheckPromises = timelineConfig.map(async (yearData) => {
        const validImages = [];
        for (let i = 1; i <= 7; i++) {
            const imageName = `image${i}.jpg`;
            const imageUrl = `images/events/${yearData.year}/${imageName}`;
            const exists = await checkImage(imageUrl);
            if (exists) {
                validImages.push(imageName);
            }
        }
        yearData.images = validImages;
        return yearData;
    });

    const updatedTimelineData = await Promise.all(imageCheckPromises);
    const finalTimelineData = updatedTimelineData.filter(data => data.images.length > 0);

    renderTimeline(finalTimelineData);
}

// Renders the timeline based on the provided data
function renderTimeline(timelineData) {
    const timelineContainer = document.querySelector('.vertical-timeline');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = timelineData.map(data => {
        const photosHTML = data.images.map((imageName, index) => `
            <div class="timeline-photo" data-year="${data.year}" data-index="${index}">
                <img src="images/events/${data.year}/${imageName}" alt="Event photo from ${data.year}" loading="lazy">
            </div>`).join('');

        return `
            <div class="timeline-item">
                <div class="timeline-dot"><i class="fas ${data.icon}"></i></div>
                <div class="timeline-content-item">
                    <h4>${data.year}</h4>
                    <p>${data.description}</p>
                    <div class="timeline-photos" data-year="${data.year}">${photosHTML}</div>
                </div>
            </div>`;
    }).join('');
}


// --- Other functions (Hero, Menu, Scroll, etc.) ---

function initHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-bg-slide');
    const imageFiles = ['IMG_4734.jpg', 'IMG_4735.jpg', 'IMG_4736.jpg', 'IMG_4737.jpg', 'IMG_4738.jpg'];
    slides.forEach((slide, index) => {
        if (imageFiles[index]) slide.style.backgroundImage = `url('${imageFiles[index]}')`;
    });
    let currentSlide = 0;
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');
mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('is-active');
    navMenu.classList.toggle('active');
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navMenu.classList.contains('active')) {
            mobileMenu.classList.remove('is-active');
            navMenu.classList.remove('active');
        }
    });
});

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(element => {
        if (element.getBoundingClientRect().top < window.innerHeight - 150) {
            element.classList.add('animated');
        }
    });
}
window.addEventListener('scroll', animateOnScroll);

// --- Registration Data Functions ---

let registrationData = [];

async function fetchRegistrationData() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data from Google Sheets');
        const csvText = await response.text();
        const data = parseCSV(csvText);
        const rows = data.slice(1);
        registrationData = rows.map(row => ({
            name: row[1] || '',
            phone: row[2] || '',
            adults: parseInt(row[3]) || 0,
            kids_5_10: parseInt(row[4]) || 0,
            kids_under_5: parseInt(row[5]) || 0,
            location: row[6] || '',
            transport: row[7] || '',
            cultural: row[8] || ''
        }));
    } catch (error) {
        console.error('Error fetching registration data:', error);
        registrationData = generateMockData();
    } finally {
        updateRegistrationTable();
        updateStats();
    }
}

function parseCSV(csvText) {
    return csvText.split('\n').map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
}

function generateMockData() {
    return [
        { name: 'Rajesh Kumar', phone: '9876543210', adults: 2, kids_5_10: 1, kids_under_5: 0, location: 'Marathahalli', transport: 'Car', cultural: 'Singing' },
        { name: 'Priya Sharma', phone: '9876543211', adults: 3, kids_5_10: 2, kids_under_5: 1, location: 'Whitefield', transport: 'Car', cultural: 'Dancing' },
        { name: 'Amit Patel', phone: '9876543212', adults: 4, kids_5_10: 0, kids_under_5: 0, location: 'Koramangala', transport: 'Bike', cultural: 'Backstage support' },
    ];
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

// --- Countdown Timer ---

function updateCountdown() {
    const eventDate = new Date('2025-09-14T09:00:00');
    const now = new Date();
    const timeDiff = eventDate - now;
    if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    } else {
        document.getElementById('countdown').innerHTML = '<div class="countdown-item event-started"><span class="countdown-number">🎉</span><span class="countdown-label">Event Started!</span></div>';
        document.querySelector('.countdown-text').textContent = 'The event is happening now!';
    }
}

// --- Photo Modal ---

let currentPhotoIndex = 0;
let currentYearPhotos = [];
let currentYear = '';

function initPhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.photo-modal-close');
    const prevBtn = document.querySelector('.photo-modal-prev');
    const nextBtn = document.querySelector('.photo-modal-next');

    document.addEventListener('click', (e) => {
        const photoDiv = e.target.closest('.timeline-photo:not(.timeline-photo-placeholder)');
        if (photoDiv) {
            currentYear = photoDiv.getAttribute('data-year');
            currentPhotoIndex = parseInt(photoDiv.getAttribute('data-index'));
            const yearData = timelineConfig.find(d => d.year === currentYear);
            currentYearPhotos = yearData ? yearData.images : [];
            if (currentYearPhotos.length > 0) {
                updateModalImage();
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    const hideModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    };

    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

    const showPreviousPhoto = () => {
        if (currentYearPhotos.length > 1) {
            currentPhotoIndex = (currentPhotoIndex - 1 + currentYearPhotos.length) % currentYearPhotos.length;
            updateModalImage();
        }
    };

    const showNextPhoto = () => {
        if (currentYearPhotos.length > 1) {
            currentPhotoIndex = (currentPhotoIndex + 1) % currentYearPhotos.length;
            updateModalImage();
        }
    };

    prevBtn.addEventListener('click', showPreviousPhoto);
    nextBtn.addEventListener('click', showNextPhoto);

    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) {
            if (e.key === 'Escape') hideModal();
            if (e.key === 'ArrowLeft') showPreviousPhoto();
            if (e.key === 'ArrowRight') showNextPhoto();
        }
    });

    function updateModalImage() {
        modalImg.src = `images/events/${currentYear}/${currentYearPhotos[currentPhotoIndex]}`;
        modalImg.alt = `Event photo from ${currentYear}`;
        const navVisible = currentYearPhotos.length > 1;
        prevBtn.style.display = navVisible ? 'block' : 'none';
        nextBtn.style.display = navVisible ? 'block' : 'none';
    }
}
