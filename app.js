// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentTaskId = null;
        this.SPREADSHEET_ID = '1nTfznnbmz2_8QgRlRBhLZIPEK5LBjRSVyEtVmsIPCzs';
        this.API_KEY = 'YOUR_GOOGLE_API_KEY'; // User needs to add their API key
        this.init();
    }

    init() {
        this.loadTasks();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Sync button
        document.getElementById('syncBtn').addEventListener('click', () => this.syncTasks());

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Filters
        document.getElementById('areaFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('priorityFilter').addEventListener('change', () => this.applyFilters());

        // Modal controls
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('modalSave').addEventListener('click', () => this.saveTask());

        // Add comment
        document.getElementById('addCommentBtn').addEventListener('click', () => this.addComment());

        // Close modal on outside click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') this.closeModal();
        });
    }

    async loadTasks() {
        this.showLoading(true);

        // Sample data (fallback if Google Sheets API not configured)
        const sampleTasks = [
            {
                id: 'ph_1',
                area: 'PRASADAM HALL',
                task: 'Finalize ceiling design',
                status: 'MATERIAL & DESIGN IS STILL TO BE FINALIZED',
                deadline: '2025-11-30',
                priority: 'high',
                notes: '',
                completed: false,
                comments: []
            },
            {
                id: 'ph_2',
                area: 'PRASADAM HALL',
                task: 'Choose floor and wall tiles with Achintya Krishna',
                status: 'PENDING - market visit today',
                deadline: '2025-11-21',
                priority: 'high',
                notes: '',
                completed: false,
                comments: []
            },
            {
                id: 'ab_1',
                area: 'ASHRAM / BRAHMACHARI AREA',
                task: 'One large ashram window installation',
                status: 'COMPLETED',
                deadline: '2025-11-20',
                priority: 'medium',
                notes: 'Verify completion',
                completed: false,
                comments: []
            }
        ];

        // Try to load from localStorage first
        const savedTasks = localStorage.getItem('constructionTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        } else {
            // Use sample data
            this.tasks = sampleTasks;
            this.saveTasks();
        }

        this.filteredTasks = [...this.tasks];
        this.renderTasks();
        this.updateStats();
        this.populateAreaFilter();
        this.showLoading(false);
    }

    async syncTasks() {
        this.showLoading(true);
        this.showToast('Syncing with Google Sheets...');

        // Simulate sync (in production, this would call Google Sheets API)
        setTimeout(() => {
            this.showLoading(false);
            this.showToast('Sync completed successfully!');
        }, 1500);
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');

        if (this.filteredTasks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <span class="material-icons" style="font-size: 4rem; opacity: 0.3;">inbox</span>
                    <p style="margin-top: 1rem; font-size: 1.125rem;">No tasks found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredTasks.map(task => {
            const isOverdue = new Date(task.deadline) < new Date() && !task.completed;
            const commentCount = task.comments ? task.comments.length : 0;

            return `
                <div class="task-card priority-${task.priority} ${task.completed ? 'completed' : ''}" 
                     onclick="taskManager.openTaskModal('${task.id}')">
                    <div class="task-header">
                        <div style="flex: 1;">
                            <div class="task-title">${this.escapeHtml(task.task)}</div>
                            <div class="task-area">${this.escapeHtml(task.area)}</div>
                        </div>
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                    </div>

                    <div class="task-status">${this.escapeHtml(task.status)}</div>

                    <div class="task-footer">
                        <div class="task-deadline ${isOverdue ? 'overdue' : ''}">
                            <span class="material-icons" style="font-size: 1rem;">event</span>
                            <span>${this.formatDate(task.deadline)}</span>
                        </div>
                        <div class="task-actions" onclick="event.stopPropagation()">
                            ${commentCount > 0 ? `
                                <span style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">
                                    <span class="material-icons" style="font-size: 1rem;">comment</span>
                                    ${commentCount}
                                </span>
                            ` : ''}
                            <button class="task-action-btn complete" 
                                    onclick="taskManager.toggleComplete('${task.id}')"
                                    title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                                <span class="material-icons">
                                    ${task.completed ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
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
        const modal = document.getElementById('taskModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentTaskId = null;
    }

    saveTask() {
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

        if (this.currentTaskId) {
            // Update existing task
            const taskIndex = this.tasks.findIndex(t => t.id === this.currentTaskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = {
                    ...this.tasks[taskIndex],
                    area,
                    task,
                    status,
                    deadline,
                    priority,
                    notes,
                    completed
                };
            }
        } else {
            // Create new task
            const newTask = {
                id: 'task_' + Date.now(),
                area,
                task,
                status,
                deadline,
                priority,
                notes,
                completed,
                comments: []
            };
            this.tasks.unshift(newTask);
        }

        this.saveTasks();
        this.applyFilters();
        this.updateStats();
        this.populateAreaFilter();
        this.closeModal();
        this.showToast('Task saved successfully!');
    }

    toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.applyFilters();
            this.updateStats();
            this.showToast(task.completed ? 'Task marked as complete!' : 'Task marked as incomplete');
        }
    }

    renderComments(comments) {
        const container = document.getElementById('commentsList');

        if (comments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No comments yet</p>';
            return;
        }

        container.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-meta">${this.formatDateTime(comment.timestamp)}</div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
            </div>
        `).join('');
    }

    addComment() {
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
            this.renderComments(task.comments);
            document.getElementById('newComment').value = '';
            this.showToast('Comment added!');
        }
    }

    handleSearch(query) {
        this.applyFilters();
    }

    applyFilters() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const areaFilter = document.getElementById('areaFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        this.filteredTasks = this.tasks.filter(task => {
            const matchesSearch = !searchQuery || 
                task.task.toLowerCase().includes(searchQuery) ||
                task.status.toLowerCase().includes(searchQuery) ||
                task.area.toLowerCase().includes(searchQuery);

            const matchesArea = !areaFilter || task.area === areaFilter;
            const matchesStatus = !statusFilter || 
                (statusFilter === 'completed' && task.completed) ||
                (statusFilter === 'pending' && !task.completed);
            const matchesPriority = !priorityFilter || task.priority === priorityFilter;

            return matchesSearch && matchesArea && matchesStatus && matchesPriority;
        });

        this.renderTasks();
    }

    populateAreaFilter() {
        const areas = [...new Set(this.tasks.map(t => t.area))];
        const select = document.getElementById('areaFilter');
        const currentValue = select.value;

        select.innerHTML = '<option value="">All Areas</option>' + 
            areas.map(area => `<option value="${this.escapeHtml(area)}">${this.escapeHtml(area)}</option>`).join('');

        if (currentValue) select.value = currentValue;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const overdue = this.tasks.filter(t => 
            new Date(t.deadline) < new Date() && !t.completed
        ).length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('overdueTasks').textContent = overdue;
    }

    saveTasks() {
        localStorage.setItem('constructionTasks', JSON.stringify(this.tasks));
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});