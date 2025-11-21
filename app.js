// AI Task Manager Application - v0.13
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

        if (CONFIG.AUTO_SYNC_ENABLED) {
            setInterval(() => this.syncTasks(), CONFIG.AUTO_SYNC_INTERVAL);
        }
    }

    attachEventListeners() {
        document.getElementById('syncBtn').addEventListener('click', () => this.syncTasks());
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('versionBadge').addEventListener('click', () => this.openChangelogModal());
        document.getElementById('changelogClose').addEventListener('click', () => this.closeChangelogModal());
        document.getElementById('changelogModal').addEventListener('click', (e) => {
            if (e.target.id === 'changelogModal') this.closeChangelogModal();
        });
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
            this.showToast('⚠️ Loading sample data');
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
        if (this.syncInProgress) return false;
        this.syncInProgress = true;

        try {
            await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: JSON.stringify({action: 'updateTask', task: task})
            });
            this.syncInProgress = false;
            return true;
        } catch (error) {
            console.error('Error:', error);
            this.syncInProgress = false;
            return false;
        }
    }

    loadSampleData() {
        this.tasks = [
            {id: 'ph_1', area: 'PRASADAM HALL', task: 'Finalize ceiling design', status: 'IN PROGRESS', deadline: '2025-11-30', priority: 'high', notes: '', completed: false, comments: []},
            {id: 'ph_2', area: 'PRASADAM HALL', task: 'Choose floor tiles', status: 'PENDING', deadline: '2025-11-25', priority: 'high', notes: '', completed: false, comments: []},
            {id: 'ta_1', area: 'TEMPLE AREA', task: 'Electrical wiring', status: 'PLANNED', deadline: '2025-12-01', priority: 'high', notes: '', completed: false, comments: []},
            {id: 'ta_2', area: 'TEMPLE AREA', task: 'Install boards', status: 'PLANNED', deadline: '2025-12-03', priority: 'high', notes: '', completed: false, comments: []},
            {id: 'ab_1', area: 'ASHRAM AREA', task: 'Window installation', status: 'COMPLETED', deadline: '2025-11-20', priority: 'medium', notes: '', completed: false, comments: []},
            {id: 'st_1', area: 'STP & TOILET', task: 'Monitor toilet', status: 'ALL CLEAR', deadline: '2025-12-01', priority: 'low', notes: '', completed: false, comments: []}
        ];
        this.saveTasks();
    }

    parseComments(commentsStr) {
        try {
            const parsed = JSON.parse(commentsStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    }

    async syncTasksInBackground() {
        try {
            await this.loadFromGoogleSheets();
            this.applyFilters();
            this.updateStats();
            this.updateProgressBars();
        } catch (error) {
            console.log('Background sync failed:', error);
        }
    }

    async syncTasks() {
        this.showLoading(true);
        this.showToast('🔄 Syncing...');
        try {
            await this.loadFromGoogleSheets();
            this.applyFilters();
            this.updateStats();
            this.updateProgressBars();
        } catch (error) {
            this.showToast('⚠️ Sync failed');
        }
        this.showLoading(false);
    }

    updateProgressBars() {
        const templeTasks = this.tasks.filter(t => t.area && t.area.toUpperCase().includes('TEMPLE'));
        const templeCompleted = templeTasks.filter(t => t.completed).length;
        const templeProgress = templeTasks.length > 0 ? Math.round((templeCompleted / templeTasks.length) * 100) : 0;

        const prasadamTasks = this.tasks.filter(t => t.area && t.area.toUpperCase().includes('PRASADAM'));
        const prasadamCompleted = prasadamTasks.filter(t => t.completed).length;
        const prasadamProgress = prasadamTasks.length > 0 ? Math.round((prasadamCompleted / prasadamTasks.length) * 100) : 0;

        const totalCompleted = this.tasks.filter(t => t.completed).length;
        const overallProgress = this.tasks.length > 0 ? Math.round((totalCompleted / this.tasks.length) * 100) : 0;

        document.getElementById('templeProgress').textContent = templeProgress + '%';
        document.getElementById('templeBar').style.width = templeProgress + '%';
        document.getElementById('prasadamProgress').textContent = prasadamProgress + '%';
        document.getElementById('prasadamBar').style.width = prasadamProgress + '%';
        document.getElementById('overallProgress').textContent = overallProgress + '%';
        document.getElementById('overallBar').style.width = overallProgress + '%';
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        if (this.filteredTasks.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);"><span class="material-icons" style="font-size: 4rem; opacity: 0.3;">inbox</span><p style="margin-top: 1rem; font-size: 1.125rem;">No tasks found</p></div>';
            return;
        }

        container.innerHTML = this.filteredTasks.map(task => {
            const isOverdue = new Date(task.deadline) < new Date() && !task.completed;
            const commentCount = task.comments ? task.comments.length : 0;
            return `<div class="task-card priority-${task.priority} ${task.completed ? 'completed' : ''}" onclick="taskManager.openTaskModal('${task.id}')"><div class="task-header"><div style="flex: 1;"><div class="task-title">${this.escapeHtml(task.task)}</div><div class="task-area">${this.escapeHtml(task.area)}</div></div><span class="priority-badge ${task.priority}">${task.priority}</span></div><div class="task-status">${this.escapeHtml(task.status)}</div><div class="task-footer"><div class="task-deadline ${isOverdue ? 'overdue' : ''}"><span class="material-icons" style="font-size: 1rem;">event</span><span>${this.formatDate(task.deadline)}</span></div><div class="task-actions" onclick="event.stopPropagation()">${commentCount > 0 ? `<span style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);"><span class="material-icons" style="font-size: 1rem;">comment</span>${commentCount}</span>` : ''}<button class="task-action-btn complete" onclick="taskManager.toggleComplete('${task.id}')" title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}"><span class="material-icons">${task.completed ? 'check_circle' : 'radio_button_unchecked'}</span></button></div></div></div>`;
        }).join('');
    }

    openTaskModal(taskId = null) {
        this.currentTaskId = taskId;
        const modal = document.getElementById('taskModal');
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('modalTitle').textContent = 'Edit Task';
                document.getElementById('modalArea').value = task.area;
                document.getElementById('modalTask').value = task.task;
                document.getElementById('modalStatus').value = task.status;
                document.getElementById('modalDeadline').value = task.deadline;
                document.getElementById('modalPriority').value = task.priority;
                document.getElementById('modalNotes').value = task.notes || '';
                document.getElementById('modalCompleted').checked = task.completed;
                this.renderComments(task.comments || []);
            }
        } else {
            document.getElementById('modalTitle').textContent = 'New Task';
            document.getElementById('modalArea').value = '';
            document.getElementById('modalTask').value = '';
            document.getElementById('modalStatus').value = '';
            document.getElementById('modalDeadline').value = '';
            document.getElementById('modalPriority').value = 'medium';
            document.getElementById('modalNotes').value = '';
            document.getElementById('modalCompleted').checked = false;
            this.renderComments([]);
        }
        document.getElementById('newComment').value = '';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.body.style.overflow = '';
        this.currentTaskId = null;
    }

    async saveTask() {
        const area = document.getElementById('modalArea').value.trim();
        const task = document.getElementById('modalTask').value.trim();
        const status = document.getElementById('modalStatus').value.trim();
        const deadline = document.getElementById('modalDeadline').value;
        const priority = document.getElementById('modalPriority').value;
        const notes = document.getElementById('modalNotes').value.trim();
        const completed = document.getElementById('modalCompleted').checked;

        if (!area || !task || !status || !deadline) {
            this.showToast('Please fill in all required fields');
            return;
        }

        let taskObj;
        if (this.currentTaskId) {
            const taskIndex = this.tasks.findIndex(t => t.id === this.currentTaskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = {...this.tasks[taskIndex], area, task, status, deadline, priority, notes, completed};
                taskObj = this.tasks[taskIndex];
            }
        } else {
            taskObj = {id: 'task_' + Date.now(), area, task, status, deadline, priority, notes, completed, comments: []};
            this.tasks.unshift(taskObj);
        }

        this.saveTasks();
        this.saveToGoogleSheets(taskObj);
        this.applyFilters();
        this.updateStats();
        this.updateProgressBars();
        this.populateAreaFilter();
        this.closeModal();
        this.showToast('✅ Saved!');
    }

    async toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.saveToGoogleSheets(task);
            this.applyFilters();
            this.updateStats();
            this.updateProgressBars();
            this.showToast(task.completed ? '✅ Completed!' : '🔄 Reopened');
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
            task.comments.push({text: commentText, timestamp: new Date().toISOString()});
            this.saveTasks();
            this.saveToGoogleSheets(task);
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

    openChangelogModal() {
        document.getElementById('changelogModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeChangelogModal() {
        document.getElementById('changelogModal').classList.remove('active');
        document.body.style.overflow = '';
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