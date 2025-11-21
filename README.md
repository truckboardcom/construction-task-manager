# 🏗️ Construction Task Manager

A modern, mobile-responsive task management application synchronized with Google Sheets. Built for construction project management with real-time updates, commenting system, and advanced filtering.

![Task Manager](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 📱 **Fully Mobile Responsive** - Works perfectly on all devices
- 🎨 **Modern Material Design** - Clean, professional interface
- ⚡ **Lightning Fast** - Optimized performance
- 📊 **Real-time Stats** - Track progress at a glance
- 💬 **Comment System** - Collaborate with your team
- 🔍 **Advanced Filtering** - Search by area, status, priority
- ✅ **Task Management** - Create, edit, complete tasks
- 🔄 **Google Sheets Sync** - Two-way synchronization
- 🎯 **Priority Levels** - High, Medium, Low priorities
- 📅 **Deadline Tracking** - Never miss a deadline

## 🚀 Quick Start

### Option 1: Deploy to Vercel (Recommended)

1. Click the button below:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/truckboardcom/construction-task-manager)

2. Follow the deployment wizard
3. Your app will be live in seconds!

### Option 2: Deploy to Netlify

1. Click the button below:

   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/truckboardcom/construction-task-manager)

2. Authorize and deploy
3. Done!

### Option 3: Run Locally

```bash
# Clone the repository
git clone https://github.com/truckboardcom/construction-task-manager.git

# Navigate to project directory
cd construction-task-manager

# Open with a local server (choose one):

# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000

# Open browser
# Navigate to http://localhost:8000
```

## 📋 Google Sheets Integration

To enable Google Sheets synchronization:

1. **Get Google Sheets API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Google Sheets API"
   - Create credentials (API Key)
   - Restrict the key to Google Sheets API

2. **Configure Your Spreadsheet:**
   - Open your Google Sheet
   - Click "Share" and set to "Anyone with the link can view"
   - Copy the Spreadsheet ID from URL

3. **Update Configuration:**
   - Open `config.js`
   - Replace `YOUR_GOOGLE_API_KEY` with your API key
   - Replace the SPREADSHEET_ID with your sheet ID

4. **Sheet Structure:**
   Your Google Sheet should have these columns:
   ```
   ID | Area | Task | Status | Deadline | Priority | Notes | Completed | Comments
   ```

## 🎯 Usage Guide

### Creating Tasks
1. Click "New Task" button
2. Fill in task details
3. Set priority and deadline
4. Click "Save Changes"

### Editing Tasks
1. Click on any task card
2. Update information
3. Add comments if needed
4. Save changes

### Filtering Tasks
- Use search box for quick text search
- Filter by Area, Status, or Priority
- Combine filters for precise results

### Managing Comments
1. Open any task
2. Scroll to comments section
3. Type your comment
4. Click "Add Comment"

### Completing Tasks
- Click the circle icon on task card
- Or open task and check "Mark as Completed"

## 📱 Mobile Features

- Touch-optimized interface
- Swipe-friendly modals
- Responsive grid layout
- Mobile-first design
- Fast loading on 3G/4G

## 🎨 Customization

### Colors
Edit `styles.css` and modify CSS variables:

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    /* ... more variables */
}
```

### Priority Badges
Customize priority colors in the `.priority-badge` classes.

### Layout
Adjust grid spacing and card sizes in the responsive media queries.

## 🔧 Configuration

### config.js
```javascript
const CONFIG = {
    SPREADSHEET_ID: 'your-spreadsheet-id',
    API_KEY: 'your-api-key',
    SHEET_NAME: 'Sheet1',
    AUTO_SYNC_INTERVAL: 300000, // 5 minutes
};
```

## 🏗️ Project Structure

```
construction-task-manager/
├── index.html          # Main HTML file
├── styles.css          # Styling and responsive design
├── app.js              # Application logic
├── config.js           # Configuration file
├── server.js           # Optional Node.js server
├── package.json        # Dependencies
└── README.md           # Documentation
```

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security

- API keys should be restricted to your domain
- Use environment variables in production
- Enable CORS properly for API calls
- Validate all user inputs
- Sanitize data before display

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Material Icons by Google
- Inter Font by Rasmus Andersson
- Inspired by modern project management tools

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [GitHub Issues](https://github.com/truckboardcom/construction-task-manager/issues)

## 🚧 Roadmap

- [ ] Calendar view
- [ ] Team member assignments
- [ ] File attachments
- [ ] Email notifications
- [ ] Export to PDF
- [ ] Gantt chart view
- [ ] Time tracking
- [ ] Mobile app (React Native)

---

Made with ❤️ for construction project management
