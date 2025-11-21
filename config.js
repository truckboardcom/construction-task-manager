// Configuration file for Task Manager

const CONFIG = {
    // Google Sheets Configuration
    SPREADSHEET_ID: '1nTfznnbmz2_8QgRlRBhLZIPEK5LBjRSVyEtVmsIPCzs',
    API_KEY: 'YOUR_GOOGLE_API_KEY', // Replace with your Google Sheets API key
    SHEET_NAME: 'Лист1',

    // API Endpoints
    SHEETS_API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',

    // Auto-sync settings
    AUTO_SYNC_ENABLED: false, // Set to true to enable automatic sync
    AUTO_SYNC_INTERVAL: 300000, // 5 minutes in milliseconds

    // App Settings
    APP_NAME: 'Construction Task Manager',
    DATE_FORMAT: 'YYYY-MM-DD',

    // Features
    ENABLE_COMMENTS: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_NOTIFICATIONS: true,
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
