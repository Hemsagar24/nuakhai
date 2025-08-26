// Google Sheets API configuration
const SHEET_ID = '1VuxB1QHP4yKCHcefYVGWHnczekJ23ys_Xt-XkB61bfM';
const SHEET_NAME = 'Form_Responses'; // Update this if your sheet name is different
const API_KEY = 'YOUR_API_KEY'; // You'll need to get this from Google Cl// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Add scroll animation class to elements
    const elementsToAnimate = document.querySelectorAll('.section-header, .feature-card, .timeline-content-item, .stat-card, .contact-card');
    elementsToAnimate.forEach(element => {
        element.classList.add('animate-on-scroll');
    });
    
    // Initial animation check
    animateOnScroll();
    
    // Fetch registration data
    fetchRegistrationData();
    
    // Initialize hero background slideshow
    initHeroSlideshow();
    
    // Load timeline images
    loadTimelineImages();
    
    // Initialize photo modal
    initPhotoModal();
});

// Hero Background Slideshow
function initHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-bg-slide');
    const imageFiles = [
        'IMG_4734.jpg',
        'IMG_4735.jpg', 
        'IMG_4736.jpg',
        'IMG_4737.jpg',
        'IMG_4738.jpg'
    ];
    
    // Set background images
    slides.forEach((slide, index) => {
        if (imageFiles[index]) {
            slide.style.backgroundImage = `url('${imageFiles[index]}')`;
        }
    });
    
    let currentSlide = 0;
    
    function nextSlide() {
        // Remove active class from current slide
        slides[currentSlide].classList.remove('active');
        
        // Move to next slide
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Add active class to new slide
        slides[currentSlide].classList.add('active');
    }
    
    // Change slide every 4 seconds
    setInterval(nextSlide, 4000);
}

// Add some interactive featuresMobile menu toggle
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('is-active');
    navMenu.classList.toggle('active');
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        // Close mobile menu if open
        navMenu.classList.remove('active');
        mobileMenu.classList.remove('is-active');
    });
});

// Navbar background on scroll
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

// Scroll animations
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animated');
        }
    });
};

window.addEventListener('scroll', animateOnScroll);

// Registration data functions
let registrationData = [];

// Function to fetch data from Google Sheets
// Google Sheets Public CSV Integration
async function fetchRegistrationData() {
    try {
        // Replace with your actual Google Sheets ID
        const SHEET_ID = '1157074278';
        
        // Public Google Sheets CSV export URL
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data from Google Sheets');
        }
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        
        updateRegistrationTable(data);
        updateRegistrationStats(data);
        
    } catch (error) {
        console.error('Error fetching registration data:', error);
        // Fallback to mock data
        const mockData = [
            ['Name', 'Phone', 'Email', 'Location', 'Village', 'Attending', 'Special Requirements'],
            ['Ramesh Patel', '9876543210', 'ramesh@email.com', 'Mumbai', 'Surat', 'Yes', 'Vegetarian'],
            ['Priya Shah', '9876543211', 'priya@email.com', 'Delhi', 'Ahmedabad', 'Yes', 'None'],
            ['Amit Kumar', '9876543212', 'amit@email.com', 'Bangalore', 'Vadodara', 'Yes', 'Wheelchair Access'],
            ['Sunita Desai', '9876543213', 'sunita@email.com', 'Pune', 'Rajkot', 'Maybe', 'None'],
            ['Vikash Yadav', '9876543214', 'vikash@email.com', 'Chennai', 'Bhavnagar', 'Yes', 'Vegetarian']
        ];
        updateRegistrationTable(mockData);
        updateRegistrationStats(mockData);
    }
}

// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let line of lines) {
        if (line.trim()) {
            // Simple CSV parsing - handles basic cases
            const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
            result.push(row);
        }
    }
    
    return result;
}

// Generate mock data (replace with actual API call)
function generateMockData() {
    return [
        {
            timestamp: '2025-08-25 10:30:00',
            name: 'Rajesh Kumar',
            phone: '9876543210',
            adults: 2,
            kids_5_10: 1,
            kids_under_5: 0,
            location: 'Marathahalli',
            transport: 'Car',
            cultural: 'Singing'
        },
        {
            timestamp: '2025-08-25 11:15:00',
            name: 'Priya Sharma',
            phone: '9876543211',
            adults: 3,
            kids_5_10: 2,
            kids_under_5: 1,
            location: 'Whitefield',
            transport: 'Car',
            cultural: 'Dancing'
        },
        {
            timestamp: '2025-08-25 12:00:00',
            name: 'Amit Patel',
            phone: '9876543212',
            adults: 4,
            kids_5_10: 0,
            kids_under_5: 0,
            location: 'Koramangala',
            transport: 'Bike',
            cultural: 'Backstage support'
        },
        {
            timestamp: '2025-08-25 14:30:00',
            name: 'Sunita Mishra',
            phone: '9876543213',
            adults: 2,
            kids_5_10: 1,
            kids_under_5: 1,
            location: 'Indiranagar',
            transport: 'Car',
            cultural: 'Comedy'
        },
        {
            timestamp: '2025-08-25 16:45:00',
            name: 'Deepak Singh',
            phone: '9876543214',
            adults: 1,
            kids_5_10: 0,
            kids_under_5: 0,
            location: 'HSR Layout',
            transport: 'Other',
            cultural: 'Anchoring'
        }
    ];
}

// Update registration table
function updateRegistrationTable() {
    const tableBody = document.getElementById('registrationData');
    
    if (registrationData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="loading">No registrations found</td>
            </tr>
        `;
        return;
    }

    const filteredData = filterData();
    
    tableBody.innerHTML = filteredData.map((row, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${row.name}</td>
            <td>${row.phone}</td>
            <td>${row.adults}</td>
            <td>${row.kids_5_10}</td>
            <td>${row.kids_under_5}</td>
            <td>${row.location}</td>
            <td>${row.transport}</td>
            <td>${row.cultural}</td>
        </tr>
    `).join('');
}

// Filter data based on search input
function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        return registrationData;
    }
    
    return registrationData.filter(row => 
        row.name.toLowerCase().includes(searchTerm) ||
        row.phone.includes(searchTerm) ||
        row.location.toLowerCase().includes(searchTerm)
    );
}

// Update statistics
function updateStats() {
    const totalFamilies = registrationData.length;
    const totalAdults = registrationData.reduce((sum, row) => sum + parseInt(row.adults), 0);
    const totalKids = registrationData.reduce((sum, row) => 
        sum + parseInt(row.kids_5_10) + parseInt(row.kids_under_5), 0
    );

    document.getElementById('total-families').textContent = totalFamilies;
    document.getElementById('total-adults').textContent = totalAdults;
    document.getElementById('total-kids').textContent = totalKids;
}

// Show error message
function showErrorMessage() {
    const tableBody = document.getElementById('registrationData');
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="loading" style="color: #e74c3c;">
                <i class="fas fa-exclamation-triangle"></i> 
                Error loading registration data. Please try again later.
            </td>
        </tr>
    `;
    
    // Set default stats
    document.getElementById('total-families').textContent = '—';
    document.getElementById('total-adults').textContent = '—';
    document.getElementById('total-kids').textContent = '—';
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', updateRegistrationTable);

// Refresh button functionality
document.getElementById('refreshBtn').addEventListener('click', () => {
    document.getElementById('refreshBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    
    setTimeout(() => {
        fetchRegistrationData();
        document.getElementById('refreshBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    }, 1000);
});

// Real Google Sheets API function (commented out - uncomment when you have API key)
/*
async function fetchFromGoogleSheets() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            const rows = data.values.slice(1);
            
            registrationData = rows.map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
                });
                return rowData;
            });
            
            updateRegistrationTable();
            updateStats();
        }
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        showErrorMessage();
    }
}
*/

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Add scroll animation class to elements
    const elementsToAnimate = document.querySelectorAll('.section-header, .feature-card, .schedule-item, .stat-card, .contact-card');
    elementsToAnimate.forEach(element => {
        element.classList.add('animate-on-scroll');
    });
    
    // Initial animation check
    animateOnScroll();
    
    // Fetch registration data
    fetchRegistrationData();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add click effect to cards
    const cards = document.querySelectorAll('.feature-card, .stat-card, .contact-card, .timeline-content-item');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add hover effect to timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const dot = this.querySelector('.timeline-dot');
            dot.style.transform = 'scale(1.1)';
        });
        
        item.addEventListener('mouseleave', function() {
            const dot = this.querySelector('.timeline-dot');
            dot.style.transform = 'scale(1)';
        });
    });
});

// Countdown timer (for event countdown)
function updateCountdown() {
    const eventDate = new Date('2025-09-14T09:00:00');
    const now = new Date();
    const timeDiff = eventDate - now;
    
    if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        // Update countdown display
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        
        // Add pulse animation to seconds
        const secondsElement = document.getElementById('seconds');
        secondsElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            secondsElement.style.transform = 'scale(1)';
        }, 100);
    } else {
        // Event has started or passed
        document.getElementById('countdown').innerHTML = `
            <div class="countdown-item event-started">
                <span class="countdown-number">🎉</span>
                <span class="countdown-label">Event Started!</span>
            </div>
        `;
        document.querySelector('.countdown-text').textContent = 'The event is happening now!';
    }
}

// Initialize countdown and update every second
document.addEventListener('DOMContentLoaded', () => {
    updateCountdown(); // Initial call
    setInterval(updateCountdown, 1000); // Update every second
});

// Update countdown every minute (keeping this for compatibility)
setInterval(updateCountdown, 60000);

// Performance optimization - lazy loading for images (when you add real images)
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Call lazy loading when images are added
// lazyLoadImages();

// Timeline Images Management
const timelineImages = {
    2024: ["image1.jpg", "image2.jpg", "image3.jpg"],
    2023: ["image1.jpg", "image2.jpg", "image3.jpg"],
    2022: ["image1.jpg", "image2.jpg", "image3.jpg"],
    2021: ["image1.jpg", "image2.jpg", "image3.jpg"],
    2020: ["image1.jpg", "image2.jpg", "image3.jpg"],
    2019: [] // First event - limited documentation
};

// Load timeline images for each year
function loadTimelineImages() {
    const timelinePhotosContainers = document.querySelectorAll('.timeline-photos[data-year]');
    
    timelinePhotosContainers.forEach(container => {
        const year = container.getAttribute('data-year');
        const images = timelineImages[year] || [];
        
        container.innerHTML = ''; // Clear existing content
        
        if (images.length > 0) {
            images.forEach((imageName, index) => {
                const photoDiv = document.createElement('div');
                photoDiv.className = 'timeline-photo';
                photoDiv.setAttribute('data-year', year);
                photoDiv.setAttribute('data-index', index);
                
                const img = document.createElement('img');
                img.src = `images/events/${year}/${imageName}`;
                img.alt = `Event photo from ${year}`;
                img.loading = 'lazy';
                
                // Handle image load error
                img.onerror = function() {
                    photoDiv.innerHTML = `
                        <div class="timeline-photo-placeholder">
                            <i class="fas fa-image"></i>
                            <span>Photo ${index + 1}</span>
                        </div>
                    `;
                };
                
                photoDiv.appendChild(img);
                container.appendChild(photoDiv);
            });
        } else {
            // Show placeholder for years with no images
            const placeholder = document.createElement('div');
            placeholder.className = 'timeline-photo-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-camera"></i>
                <span>No photos available</span>
            `;
            container.appendChild(placeholder);
        }
    });
}

// Photo Modal functionality
let currentPhotoIndex = 0;
let currentYearPhotos = [];
let currentYear = '';

function initPhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.photo-modal-close');
    const prevBtn = document.querySelector('.photo-modal-prev');
    const nextBtn = document.querySelector('.photo-modal-next');
    
    // Open modal when timeline photo is clicked
    document.addEventListener('click', (e) => {
        if (e.target.closest('.timeline-photo') && !e.target.closest('.timeline-photo-placeholder')) {
            const photoDiv = e.target.closest('.timeline-photo');
            currentYear = photoDiv.getAttribute('data-year');
            currentPhotoIndex = parseInt(photoDiv.getAttribute('data-index'));
            currentYearPhotos = timelineImages[currentYear] || [];
            
            if (currentYearPhotos.length > 0) {
                showModal();
            }
        }
    });
    
    // Close modal
    closeBtn.addEventListener('click', hideModal);
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // Navigation buttons
    prevBtn.addEventListener('click', showPreviousPhoto);
    nextBtn.addEventListener('click', showNextPhoto);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) {
            switch(e.key) {
                case 'Escape':
                    hideModal();
                    break;
                case 'ArrowLeft':
                    showPreviousPhoto();
                    break;
                case 'ArrowRight':
                    showNextPhoto();
                    break;
            }
        }
    });
    
    function showModal() {
        modalImg.src = `images/events/${currentYear}/${currentYearPhotos[currentPhotoIndex]}`;
        modalImg.alt = `Event photo from ${currentYear}`;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Update navigation button visibility
        updateNavButtons();
    }
    
    function hideModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    function showPreviousPhoto() {
        if (currentYearPhotos.length > 1) {
            currentPhotoIndex = (currentPhotoIndex - 1 + currentYearPhotos.length) % currentYearPhotos.length;
            modalImg.src = `images/events/${currentYear}/${currentYearPhotos[currentPhotoIndex]}`;
            updateNavButtons();
        }
    }
    
    function showNextPhoto() {
        if (currentYearPhotos.length > 1) {
            currentPhotoIndex = (currentPhotoIndex + 1) % currentYearPhotos.length;
            modalImg.src = `images/events/${currentYear}/${currentYearPhotos[currentPhotoIndex]}`;
            updateNavButtons();
        }
    }
    
    function updateNavButtons() {
        if (currentYearPhotos.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    }
}

// Enhanced image preloading
function preloadTimelineImages() {
    Object.keys(timelineImages).forEach(year => {
        timelineImages[year].forEach(imageName => {
            const img = new Image();
            img.src = `images/events/${year}/${imageName}`;
        });
    });
}

// Call preload function after page load
window.addEventListener('load', preloadTimelineImages);
