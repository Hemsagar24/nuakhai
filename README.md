# Aghria Nuakhai Bhetghat v3.0 Bangalore 2025 - Website

A modern, responsive website for the Aghria Nuakhai Bhetghat 2025 celebration in Bangalore.

## 🎉 Event Details

- **Date:** September 14, 2025 (Sunday)
- **Time:** 9:00 AM onwards  
- **Venue:** Backyard by FHC, Budigere Cross, Bengaluru 560049
- **Map:** [Get Directions](https://maps.app.goo.gl/KQAdKDqnDHQ5Ctdg9)

## 🌟 Features

- **Responsive Design:** Works perfectly on desktop, tablet, and mobile devices
- **Registration Integration:** Direct link to Google Forms for event registration
- **Live Registration Data:** Table displaying real-time registration information from Google Sheets
- **Event Timeline:** Complete schedule and photo gallery from previous events
- **Interactive UI:** Smooth animations and modern design elements
- **Statistics Dashboard:** Live counts of registered families, adults, and children
- **Event Countdown Timer:** Real-time countdown to the event date

## 📁 Project Structure

```
Aghria_Nuakhai_2025/
├── index.html          # Main website file
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality and Google Sheets integration
├── README.md           # Project documentation
└── .github/
    └── copilot-instructions.md
```

## 🚀 Setup Instructions

### 1. Basic Setup
1. Download or clone this project
2. Open `index.html` in a web browser to view the website
3. The website is ready to use with mock data

### 2. Google Sheets Integration (Optional)

To connect the website to your actual Google Sheets data:

1. **Get Google Sheets API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Sheets API
   - Create credentials (API Key)
   - Restrict the API key to Google Sheets API

2. **Update the JavaScript:**
   - Open `script.js`
   - Replace `YOUR_API_KEY` with your actual API key
   - Update `SHEET_NAME` if your sheet name is different from 'Form_Responses'
   - Uncomment the `fetchFromGoogleSheets()` function
   - Comment out the mock data function

3. **Sheet Permissions:**
   - Make sure your Google Sheet is publicly viewable or properly shared
   - The sheet should have the following columns:
     - Timestamp
     - Name
     - Phone Number
     - Number of Adult (10+ years)
     - Number of Kids (5 to 10 years)
     - Number of Kids (below 5 years)
     - Coming From
     - How are you commuting
     - Would like to participate in cultural program

## 🎨 Customization

### Adding Photos
1. Replace the placeholder images in the Timeline section
2. Add actual photos from last year's event
3. Update the `placeholder-img` divs in `index.html`

### Styling Changes
- Modify colors in `styles.css` by updating the CSS variables in `:root`
- Change fonts by updating the Google Fonts import
- Adjust layout by modifying the grid and flexbox properties

### Content Updates
- Update event details in `index.html`
- Modify the schedule in the Timeline section
- Add or remove sections as needed

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (up to 767px)

## 🔧 Technical Features

- **CSS Grid & Flexbox:** Modern layout techniques
- **CSS Variables:** Easy color and styling customization
- **Intersection Observer:** Smooth scroll animations
- **Fetch API:** Google Sheets data integration
- **Local Storage:** Search and filter functionality
- **Progressive Enhancement:** Works without JavaScript for basic functionality

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📞 Registration

The registration button links directly to your Google Form:
[Registration Form](https://docs.google.com/forms/d/e/1FAIpQLSfqtsVtKRb94bVyvytIDkn-7v0f7uRozrYfo25eC_LeFeCEqw/viewform)

## 🎯 Future Enhancements

- Real-time notifications for new registrations
- Photo upload feature for community members
- ✅ **Event countdown timer** (Implemented)
- Social media integration
- Multilingual support (English/Odia)
- PWA (Progressive Web App) capabilities

## 📈 Performance

- Optimized CSS and JavaScript
- Lazy loading for images
- Minified assets for production
- Fast loading times

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Make your changes
3. Test thoroughly on different devices
4. Submit a pull request

## 📄 License

This project is created for the Aghria community in Bangalore. Feel free to use and modify for similar community events.

## 🆘 Support

For technical support or questions about the website, please contact the event organizers.

---

**Made with ❤️ for the Aghria Nuakhai Bhetghat 2025 community**
