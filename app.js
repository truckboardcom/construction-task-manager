// AI Task Manager Application with Two-way Google Sheets Sync
class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentTaskId = null;
        this.SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;
        this.API_KEY = CONFIG.API_KEY;
        this.SHEET_NAME = CONFIG.SHEET_NAME;
        this.syncInProgress = false;
        this.init();
    }

    init() {
        this.loadTasks();
        this.attachEventListeners();

        // Auto-sync if enabled
        if (CONFIG.AUTO_SYNC_ENABLED) {
            setInterval(() => this.syncTasks(), CONFIG.AUTO_SYNC_INTERVAL);
        }
    }

    attachEventListeners() {
        document.getElementById('syncBtn').addEventListener('click', () => this.syncTasks());
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('areaFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('priorityFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('modalSave').addEventListener('click', () => this.saveTask());
        document.getElementById('addCommentBtn').addEventListener('click', () => this.addComment());
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') this.closeModal();
        });
    }

    async loadTasks() {
        this.showLoading(true);

        const savedTasks = localStorage.getItem('constructionTasks');
        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks);
                this.filteredTasks = [...this.tasks];
                this.renderTasks();
                this.updateStats();
                this.updateProgressBars();
                this.populateAreaFilter();
                this.showLoading(false);
                this.syncTasksInBackground();
                return;
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
        }

        try {
            await this.loadFromGoogleSheets();
        } catch (error) {
            console.log('Google Sheets load failed, using sample data:', error);
            this.showToast('⚠️ Check API key. Using sample data.');
            this.loadSampleData();
        }

        this.filteredTasks = [...this.tasks];
        this.renderTasks();
        this.updateStats();
        this.updateProgressBars();
        this.populateAreaFilter();
        this.showLoading(false);
    }

    async loadFromGoogleSheets() {
        if (!this.API_KEY || this.API_KEY === 'YOUR_GOOGLE_API_KEY') {
            throw new Error('API key not configured');
        }

        const url = `${CONFIG.SHEETS_API_BASE}/${this.SPREADSHEET_ID}/values/${encodeURIComponent(this.SHEET_NAME)}!A:I?key=${this.API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Google Sheets API error:', errorData);

            if (errorData.error && errorData.error.code === 403) {
                throw new Error('API key restricted. Add https://truckboardcom.github.io/* to allowed referrers.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rows = data.values || [];

        if (rows.length < 2) {
            throw new Error('No data in sheet');
        }

        this.tasks = rows.slice(1).map(row => ({
            id: row[0] || '',
            area: row[1] || '',
            task: row[2] || '',
            status: row[3] || '',
            deadline: row[4] || '',
            priority: (row[5] || 'medium').toLowerCase(),
            notes: row[6] || '',
            completed: row[7] === 'TRUE',
            comments: this.parseComments(row[8] || '[]')
        })).filter(task => task.id);

        this.saveTasks();
        this.showToast('✅ Synced from Google Sheets!');
    }

        async saveToGoogleSheets(task) {
        if (this.syncInProgress) {
            this.showToast('⏳ Sync in progress...');
            return false;
        }

        this.syncInProgress = true;
        this.showLoading(true);

        try {
            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: JSON.stringify({
                    action: 'updateTask',
                    task: task
                })
            });

            this.showToast('✅ Saved to Google Sheets!');
            this.syncInProgress = false;
            this.showLoading(false);
            return true;
        } catch (error) {
            console.error('Error:', error);
            this.showToast('⚠️ Save failed. Saved locally.');
            this.syncInProgress = false;
            this.showLoading(false);
            return false;
        }
    }

    async toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();

            // Save to Google Sheets
            await this.saveToGoogleSheets(task);

            this.applyFilters();
            this.updateStats();
            this.updateProgressBars();
            this.showToast(task.completed ? '✅ Task completed!' : '🔄 Task reopened');
        }
    }

    renderComments(comments) {
        const container = document.getElementById('commentsList');
        if (comments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No comments yet</p>';
            return;
        }
        container.innerHTML = comments.map(comment => `<div class="comment-item"><div class="comment-meta">${this.formatDateTime(comment.timestamp)}</div><div class="comment-text">${this.escapeHtml(comment.text)}</div></div>`).join('');
    }

    async addComment() {
        const commentText = document.getElementById('newComment').value.trim();
        if (!commentText) {
            this.showToast('Please enter a comment');
            return;
        }
        if (!this.currentTaskId) return;

        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (task) {
            if (!task.comments) task.comments = [];
            task.comments.push({
                text: commentText,
                timestamp: new Date().toISOString()
            });

            this.saveTasks();

            // Save to Google Sheets
            await this.saveToGoogleSheets(task);

            this.renderComments(task.comments);
            document.getElementById('newComment').value = '';
            this.showToast('💬 Comment added!');
        }
    }

    handleSearch(query) { this.applyFilters(); }

    applyFilters() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const areaFilter = document.getElementById('areaFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        this.filteredTasks = this.tasks.filter(task => {
            const matchesSearch = !searchQuery || task.task.toLowerCase().includes(searchQuery) || task.status.toLowerCase().includes(searchQuery) || task.area.toLowerCase().includes(searchQuery);
            const matchesArea = !areaFilter || task.area === areaFilter;
            const matchesStatus = !statusFilter || (statusFilter === 'completed' && task.completed) || (statusFilter === 'pending' && !task.completed);
            const matchesPriority = !priorityFilter || task.priority === priorityFilter;
            return matchesSearch && matchesArea && matchesStatus && matchesPriority;
        });

        this.renderTasks();
    }

    populateAreaFilter() {
        const areas = [...new Set(this.tasks.map(t => t.area))];
        const select = document.getElementById('areaFilter');
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Areas</option>' + areas.map(area => `<option value="${this.escapeHtml(area)}">${this.escapeHtml(area)}</option>`).join('');
        if (currentValue) select.value = currentValue;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const overdue = this.tasks.filter(t => new Date(t.deadline) < new Date() && !t.completed).length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('overdueTasks').textContent = overdue;
    }

    saveTasks() { localStorage.setItem('constructionTasks', JSON.stringify(this.tasks)); }
    showLoading(show) { document.getElementById('loadingOverlay').classList.toggle('active', show); }
    showToast(message) { const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
    formatDate(dateString) { const date = new Date(dateString); const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1); if (date.toDateString() === today.toDateString()) return 'Today'; else if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'; else return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    formatDateTime(isoString) { const date = new Date(isoString); return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
}

let taskManager;
document.addEventListener('DOMContentLoaded', () => { taskManager = new TaskManager(); });