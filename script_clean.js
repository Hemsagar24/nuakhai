// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initHeroSlideshow();
    updateCountdown();
    initMobileMenu();
    loadEventTimeline();
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
});

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Load Event Timeline & Memories
async function loadEventTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    
    const years = ['2024', '2023', '2022', '2021', '2020'];
    let timelineHTML = '';
    
    for (let year of years) {
        const images = await getYearImages(year);
        if (images.length > 0) {
            timelineHTML += createYearTimeline(year, images);
        }
    }
    
    if (timelineHTML) {
        container.innerHTML = timelineHTML;
    } else {
        container.innerHTML = `
            <div class="no-memories">
                <i class="fas fa-folder-open"></i>
                <h4>No Memories Yet</h4>
                <p>Add images to year folders to see memories:</p>
                <ul>
                    <li>images/events/2024/</li>
                    <li>images/events/2023/</li>
                    <li>images/events/2022/</li>
                </ul>
            </div>
        `;
    }
}

// Get images for a specific year
async function getYearImages(year) {
    const extensions = ['jpg', 'jpeg', 'png', 'gif'];
    const images = [];
    
    // Try common image names
    const imageNames = [
        'image1', 'image2', 'image3', 'image4', 'image5',
        'group', 'cultural', 'food', 'dance', 'family', 'celebration'
    ];
    
    for (let name of imageNames) {
        for (let ext of extensions) {
            try {
                const imagePath = `images/events/${year}/${name}.${ext}`;
                const response = await fetch(imagePath, { method: 'HEAD' });
                if (response.ok) {
                    images.push(imagePath);
                }
            } catch (e) {
                // Image doesn't exist, continue
            }
        }
    }
    
    return images;
}

// Create timeline HTML for a year
function createYearTimeline(year, images) {
    const descriptions = {
        '2024': 'Grand celebration with 150+ families. Cultural performances, traditional food, and community bonding.',
        '2023': 'Post-pandemic reunion brought tears of joy. Traditional rituals resumed with great enthusiasm.',
        '2022': 'Virtual celebration during pandemic. Online cultural programs kept our community connected.',
        '2021': 'Limited gathering following safety protocols. Smaller but heartfelt celebration.',
        '2020': 'Foundation year that brought Agharia families together in Bangalore.'
    };
    
    let photosHTML = '';
    images.slice(0, 6).forEach(imagePath => {
        photosHTML += `
            <div class="timeline-photo" onclick="openImageViewer('${imagePath}')">
                <img src="${imagePath}" alt="Memory from ${year}" loading="lazy">
                <div class="photo-overlay">
                    <i class="fas fa-expand-alt"></i>
                </div>
            </div>
        `;
    });
    
    if (images.length > 6) {
        photosHTML += `
            <div class="more-photos-btn">
                <span>+${images.length - 6} more</span>
            </div>
        `;
    }
    
    return `
        <div class="timeline-item">
            <div class="timeline-dot">
                <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="timeline-content-item">
                <h4>${year}</h4>
                <p>${descriptions[year] || `Memorable celebration from ${year}.`}</p>
                ${photosHTML ? `<div class="timeline-photos">${photosHTML}</div>` : ''}
            </div>
        </div>
    `;
}

// Simple image viewer
function openImageViewer(imagePath) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="this.parentElement.remove()">
            <div class="modal-image-container">
                <img src="${imagePath}" alt="Event Memory">
                <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Hero slideshow functionality
function initHeroSlideshow() {
    const images = [
        'images/IMG_4734.jpg',
        'images/Footer_01.jpg'
    ];
    
    let currentImageIndex = 0;
    const heroSection = document.querySelector('.hero');
    
    if (!heroSection) return;
    
    function changeBackgroundImage() {
        heroSection.style.backgroundImage = `url('${images[currentImageIndex]}')`;
        currentImageIndex = (currentImageIndex + 1) % images.length;
    }
    
    // Set initial image
    changeBackgroundImage();
    
    // Change image every 5 seconds
    setInterval(changeBackgroundImage, 5000);
}

// Countdown timer functionality
function updateCountdown() {
    const eventDate = new Date('September 14, 2025 10:00:00').getTime();
    const now = new Date().getTime();
    const distance = eventDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

    if (distance < 0) {
        const countdownContainer = document.querySelector('.countdown-container');
        if (countdownContainer) {
            countdownContainer.innerHTML = '<h3>Event has started!</h3>';
        }
    }
}
