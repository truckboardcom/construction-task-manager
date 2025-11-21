// Configuration file for Task Manager

const CONFIG = {
    // Google Sheets Configuration
    SPREADSHEET_ID: '1nTfznnbmz2_8QgRlRBhLZIPEK5LBjRSVyEtVmsIPCzs',
    API_KEY: 'AIzaSyC05ENRinbElLswbIfkA1MqY7L8dc_p7sY',
    SHEET_NAME: 'Лист1',

    // Apps Script Web App URL for writing data
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwXUQM-z3gluOHZwAmmY8_2Ej_sI_pngfkABjpsxgwGICQfPPJGiktynmYqo8FzqIAA/exec',

    // API Endpoints
    SHEETS_API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',

    // Auto-sync settings
    AUTO_SYNC_ENABLED: true,
    AUTO_SYNC_INTERVAL: 300000,

    // App Settings
    APP_NAME: 'AI Construction Task Manager',
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
