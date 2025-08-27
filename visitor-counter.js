// Visitor Counter using CountAPI
class VisitorCounter {
    constructor() {
        this.apiUrl = 'https://api.countapi.xyz';
        this.namespace = 'agharia-nuakhai-2025';
        this.key = 'visitors';
        this.init();
    }

    async init() {
        try {
            // Get current count and increment it
            const response = await fetch(`${this.apiUrl}/hit/${this.namespace}/${this.key}`);
            const data = await response.json();
            
            if (data.value) {
                this.displayCount(data.value);
            } else {
                // If key doesn't exist, create it
                await this.createCounter();
            }
        } catch (error) {
            console.error('Error fetching visitor count:', error);
            this.displayCount('Error');
        }
    }

    async createCounter() {
        try {
            const response = await fetch(`${this.apiUrl}/create?namespace=${this.namespace}&key=${this.key}&value=1`);
            const data = await response.json();
            this.displayCount(data.value || 1);
        } catch (error) {
            console.error('Error creating counter:', error);
            this.displayCount('Error');
        }
    }

    async getCurrentCount() {
        try {
            const response = await fetch(`${this.apiUrl}/get/${this.namespace}/${this.key}`);
            const data = await response.json();
            return data.value || 0;
        } catch (error) {
            console.error('Error getting current count:', error);
            return 0;
        }
    }

    displayCount(count) {
        // Update all elements with class 'visitor-count'
        const elements = document.querySelectorAll('.visitor-count');
        elements.forEach(element => {
            element.textContent = count.toLocaleString();
        });

        // Update elements with id 'visitor-counter'
        const counterElement = document.getElementById('visitor-counter');
        if (counterElement) {
            counterElement.textContent = count.toLocaleString();
        }
    }

    // Method to get count without incrementing (for admin purposes)
    async getCountOnly() {
        try {
            const response = await fetch(`${this.apiUrl}/get/${this.namespace}/${this.key}`);
            const data = await response.json();
            return data.value || 0;
        } catch (error) {
            console.error('Error getting count:', error);
            return 0;
        }
    }
}

// Initialize visitor counter when page loads
document.addEventListener('DOMContentLoaded', function() {
    new VisitorCounter();
});

// Optional: Add visitor counter to specific pages only
function addVisitorCounterToPage() {
    // Check if we're on a page that should count visitors
    const pagesToCount = ['index.html', 'registrations.html', '/']; // Add more pages as needed
    const currentPage = window.location.pathname.split('/').pop() || '/';
    
    if (pagesToCount.includes(currentPage) || currentPage === '') {
        new VisitorCounter();
    }
}
