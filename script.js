// Taskly - Professional Task Manager - FIXED VERSION WITH USER AUTHENTICATION
class TaskManager {
    constructor() {
        // Get current user
        this.currentUser = JSON.parse(localStorage.getItem('taskly-current-user'));
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Load user-specific data
        this.tasks = this.loadUserData('tasks');
        this.projects = this.loadUserData('projects');
        this.currentView = 'dashboard';
        this.currentProjectId = null;
        this.nextTaskId = this.loadUserData('nextTaskId', 1);
        this.nextProjectId = this.loadUserData('nextProjectId', 1);
        this.calendar = null;
        this.currentLanguage = {};
        this.completionChart = null;
        this.statusChart = null;

        this.init();
    }

    init() {

        // Restore sidebar state
        const isSidebarCollapsed = localStorage.getItem('taskly-sidebar-collapsed') === 'true';
        if (isSidebarCollapsed) {
            document.querySelector('.sidebar').classList.add('collapsed');
            document.querySelector('.main-content').classList.add('expanded');
        }

        this.applyTheme();
        this.applyLanguage();
        this.bindEvents();
        this.renderCurrentView();
        this.updateStats();
        this.updateSidebar();
        this.updateLoginUI();
        this.loadSampleData();
        this.bindNavigationLinks();
    }

    bindEvents() {
        // Sidebar toggle
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');

            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');

            // Save sidebar state to localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('taskly-sidebar-collapsed', isCollapsed);
        });
        // Quick actions
        document.getElementById('quick-add-task').addEventListener('click', () => this.openAddTaskModal());
        document.getElementById('quick-add-project').addEventListener('click', () => this.openAddProjectModal());

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());

        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal with cancel buttons
        document.querySelectorAll('.modal-cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Forms
        document.getElementById('add-task-form').addEventListener('submit', (e) => this.handleAddTask(e));
        document.getElementById('add-project-form').addEventListener('submit', (e) => this.handleAddProject(e));

        // Add task buttons
        document.querySelectorAll('#add-today-task, #add-calendar-task, #add-project-task, #add-all-task').forEach(btn => {
            btn.addEventListener('click', () => this.openAddTaskModal());
        });

        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchSettingsTab(tabId);
            });
        });

        // User buttons
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Bulk operations
        document.querySelector('.select-all-btn').addEventListener('click', () => this.selectAllTasks());
        document.querySelector('.delete-selected-btn').addEventListener('click', () => this.deleteSelectedTasks());

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Task actions (delegated)
        document.addEventListener('click', (e) => {
            // Task check
            if (e.target.classList.contains('task-check')) {
                this.toggleTask(e.target);
            }
            // Edit task
            else if (e.target.closest('.task-edit')) {
                this.editTask(e.target.closest('.task-edit'));
            }
            // Delete task
            else if (e.target.closest('.task-delete')) {
                this.deleteTask(e.target.closest('.task-delete'));
            }
            // Delete project from sidebar
            else if (e.target.closest('.project-delete-btn')) {
                const btn = e.target.closest('.project-delete-btn');
                const projectId = parseInt(btn.dataset.projectId);
                if (projectId) {
                    this.deleteProject(projectId);
                }
            }
        });
    }

    bindNavigationLinks() {
        document.addEventListener('click', (e) => {
            // Check if click is on a nav-link
            if (e.target.closest('.nav-link')) {
                e.preventDefault();
                const link = e.target.closest('.nav-link');
                const view = link.dataset.view;
                const projectId = link.dataset.projectId;

                if (view === 'project' && projectId) {
                    this.currentProjectId = parseInt(projectId);
                    this.showView('project');
                } else if (view === 'completed') {
                    this.showView('completed');
                } else if (view) {
                    this.showView(view);
                }
            }

            // Check if click is on dashboard project item
            if (e.target.closest('.project-item')) {
                e.preventDefault();
                const item = e.target.closest('.project-item');
                const projectId = parseInt(item.dataset.projectId);
                if (projectId) {
                    this.currentProjectId = projectId;
                    this.showView('project');
                }
            }
        });
    }

    loadUserData(key, defaultValue = []) {
        const userKey = `taskly-user-${this.currentUser.id}`;
        const userData = JSON.parse(localStorage.getItem(userKey)) || {};
        return userData[key] || defaultValue;
    }

    saveUserData(key, data) {
        const userKey = `taskly-user-${this.currentUser.id}`;
        const userData = JSON.parse(localStorage.getItem(userKey)) || {};
        userData[key] = data;
        localStorage.setItem(userKey, JSON.stringify(userData));
    }

    loadSampleData() {
        // Add sample data if no tasks exist
        if (this.tasks.length === 0 && this.projects.length === 0) {
            const sampleTasks = [
                {
                    id: 1,
                    title: "Welcome to Taskly!",
                    description: "This is your first task. Click the checkbox to complete it.",
                    priority: "high",
                    dueDate: new Date().toISOString().split('T')[0],
                    projectId: 1,
                    labels: ["welcome", "sample"],
                    status: "pending",
                    createdAt: new Date().toISOString(),
                    completedAt: null
                },
                {
                    id: 2,
                    title: "Create your first project",
                    description: "Projects help you organize related tasks together.",
                    priority: "medium",
                    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    projectId: null,
                    labels: ["project", "organization"],
                    status: "pending",
                    createdAt: new Date().toISOString(),
                    completedAt: null
                }
            ];

            const sampleProjects = [
                {
                    id: 1,
                    name: "Personal",
                    description: "Personal tasks and errands",
                    color: "#667eea",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: "Work",
                    description: "Work-related tasks",
                    color: "#43e97b",
                    createdAt: new Date().toISOString()
                }
            ];

            this.tasks = sampleTasks;
            this.projects = sampleProjects;
            this.nextTaskId = 3;
            this.nextProjectId = 3;
            this.saveData();
            this.updateStats();
            this.updateSidebar();
            this.renderCurrentView();
        }
    }

    applyLanguage() {
        const language = localStorage.getItem('taskly-language') || 'en';
        const translations = {
            en: {
                dashboard: "Dashboard",
                welcomeBack: "Welcome back! Here's what's happening today.",
                totalTasks: "Total Tasks",
                completed: "Completed",
                pending: "Pending",
                projects: "Projects",
                todaysTasks: "Today's Tasks",
                recentProjects: "Recent Projects",
                noTasksToday: "No tasks for today. Great job!",
                noProjects: "No projects yet. Create your first project!",
                noTasksProject: "No tasks in this project yet.",
                noTasks: "No tasks yet. Add your first task!",
                noCompleted: "No completed tasks yet.",
                noCompletedDesc: "Start completing some tasks!",
                enjoyFreeTime: "No tasks for today. Enjoy your free time!",
                overview: "Overview",
                today: "Today",
                calendar: "Calendar",
                tasks: "Tasks",
                allTasks: "All Tasks",
                completedTasks: "Completed Tasks",
                quickAdd: "Quick Add",
                newProject: "New Project",
                addTask: "Add Task",
                selectAll: "Select All",
                deleteSelected: "Delete Selected",
                cancel: "Cancel",
                save: "Save",
                login: "Login",
                logout: "Logout",
                settings: "Settings",
                addNewTask: "Add New Task",
                taskTitle: "Task Title",
                description: "Description",
                priority: "Priority",
                dueDate: "Due Date",
                project: "Project",
                labels: "Labels (comma-separated)",
                addNewProject: "Add New Project",
                projectName: "Project Name",
                projectDescription: "Description",
                projectColor: "Color",
                createProject: "Create Project",
                low: "Low",
                medium: "Medium",
                high: "High",
                profile: "Profile",
                preferences: "Preferences",
                data: "Data",
                about: "About",
                displayName: "Display Name",
                email: "Email",
                avatarUrl: "Avatar (URL)",
                theme: "Theme",
                language: "Language",
                dateFormat: "Date Format",
                timeFormat: "Time Format",
                enableNotifications: "Enable notifications",
                autoSaveChanges: "Auto-save changes",
                totalTasksStat: "Total Tasks",
                totalProjectsStat: "Total Projects",
                completedTasksStat: "Completed Tasks",
                storageUsed: "Storage Used",
                exportData: "Export Data",
                importData: "Import Data",
                clearAllData: "Clear All Data",
                checkUpdates: "Check for Updates",
                helpSupport: "Help & Support",
                version: "Version",
                build: "Build",
                developer: "Developer",
                license: "License",
                blue: "Blue",
                pink: "Pink",
                lightBlue: "Light Blue",
                green: "Green",
                rose: "Rose",
                orange: "Orange",
                mint: "Mint",
                purple: "Purple",
                light: "Light",
                dark: "Dark",
                auto: "Auto (System)",
                taskAdded: "Task added successfully!",
                projectCreated: "Project created successfully!",
                taskCompleted: "Task completed!",
                taskPending: "Task marked as pending",
                taskUpdated: "Task updated successfully!",
                taskDeleted: "Task deleted successfully!",
                projectDeleted: "Project deleted successfully!",
                allTasksCompleted: "All tasks selected and completed",
                noTasksSelected: "No tasks selected",
                profileSaved: "Profile saved successfully!",
                preferencesSaved: "Preferences saved!",
                dataExported: "Data exported successfully!",
                dataImported: "Data imported successfully!",
                allDataCleared: "All data cleared!",
                latestVersion: "You have the latest version!",
                calendarInitialized: "Calendar initialized!",
                enterTaskTitle: "Please enter a task title",
                enterProjectName: "Please enter a project name",
                deleteTaskConfirm: "Are you sure you want to delete this task?",
                deleteProjectConfirm: "Delete project? Tasks will be kept but unassigned.",
                deleteSelectedConfirm: "Delete selected task(s)?",
                logoutConfirm: "Are you sure you want to logout?",
                clearDataConfirm: "Clear all data? This cannot be undone!",
                loginToTaskly: "Login to Taskly",
                username: "Username",
                password: "Password",
                demoCredentials: "Demo Credentials:",
                orJustClick: "Or just click Login to continue",
                chartCompletionTrend: "Task Completion Trend"
            },
            tr: {
                dashboard: "Kontrol Paneli",
                welcomeBack: "Tekrar hoş geldiniz! Bugün neler oluyor.",
                totalTasks: "Toplam Görev",
                completed: "Tamamlandı",
                pending: "Bekleyen",
                projects: "Projeler",
                todaysTasks: "Bugünün Görevleri",
                recentProjects: "Son Projeler",
                noTasksToday: "Bugün için görev yok. Harika iş!",
                noProjects: "Henüz proje yok. İlk projenizi oluşturun!",
                noTasksProject: "Bu projede henüz görev yok.",
                noTasks: "Henüz görev yok. İlk görevinizi ekleyin!",
                noCompleted: "Henüz tamamlanan görev yok.",
                noCompletedDesc: "Görev tamamlamaya başlayın!",
                enjoyFreeTime: "Bugün için görev yok. Boş zamanınızın tadını çıkarın!",
                overview: "Genel Bakış",
                today: "Bugün",
                calendar: "Takvim",
                tasks: "Görevler",
                allTasks: "Tüm Görevler",
                completedTasks: "Tamamlanan Görevler",
                quickAdd: "Hızlı Ekle",
                newProject: "Yeni Proje",
                addTask: "Görev Ekle",
                selectAll: "Tümünü Seç",
                deleteSelected: "Seçilenleri Sil",
                cancel: "İptal",
                save: "Kaydet",
                login: "Giriş Yap",
                logout: "Çıkış Yap",
                settings: "Ayarlar",
                addNewTask: "Yeni Görev Ekle",
                taskTitle: "Görev Başlığı",
                description: "Açıklama",
                priority: "Öncelik",
                dueDate: "Son Tarih",
                project: "Proje",
                labels: "Etiketler (virgülle ayrılmış)",
                addNewProject: "Yeni Proje Ekle",
                projectName: "Proje Adı",
                projectDescription: "Açıklama",
                projectColor: "Renk",
                createProject: "Proje Oluştur",
                low: "Düşük",
                medium: "Orta",
                high: "Yüksek",
                profile: "Profil",
                preferences: "Tercihler",
                data: "Veri",
                about: "Hakkında",
                displayName: "Görünen Ad",
                email: "E-posta",
                avatarUrl: "Avatar (URL)",
                theme: "Tema",
                language: "Dil",
                dateFormat: "Tarih Formatı",
                timeFormat: "Saat Formatı",
                enableNotifications: "Bildirimleri etkinleştir",
                autoSaveChanges: "Değişiklikleri otomatik kaydet",
                totalTasksStat: "Toplam Görev",
                totalProjectsStat: "Toplam Proje",
                completedTasksStat: "Tamamlanan Görevler",
                storageUsed: "Kullanılan Depolama",
                exportData: "Veriyi Dışa Aktar",
                importData: "Veriyi İçe Aktar",
                clearAllData: "Tüm Veriyi Temizle",
                checkUpdates: "Güncellemeleri Kontrol Et",
                helpSupport: "Yardım & Destek",
                version: "Sürüm",
                build: "Derleme",
                developer: "Geliştirici",
                license: "Lisans",
                blue: "Mavi",
                pink: "Pembe",
                lightBlue: "Açık Mavi",
                green: "Yeşil",
                rose: "Gül",
                orange: "Turuncu",
                mint: "Nane",
                purple: "Mor",
                light: "Açık",
                dark: "Koyu",
                auto: "Otomatik (Sistem)",
                taskAdded: "Görev başarıyla eklendi!",
                projectCreated: "Proje başarıyla oluşturuldu!",
                taskCompleted: "Görev tamamlandı!",
                taskPending: "Görev bekliyor olarak işaretlendi",
                taskUpdated: "Görev başarıyla güncellendi!",
                taskDeleted: "Görev başarıyla silindi!",
                projectDeleted: "Proje başarıyla silindi!",
                allTasksCompleted: "Tüm görevler seçildi ve tamamlandı",
                noTasksSelected: "Seçili görev yok",
                profileSaved: "Profil başarıyla kaydedildi!",
                preferencesSaved: "Tercihler kaydedildi!",
                dataExported: "Veri başarıyla dışa aktarıldı!",
                dataImported: "Veri başarıyla içe aktarıldı!",
                allDataCleared: "Tüm veriler temizlendi!",
                latestVersion: "En son sürüme sahipsiniz!",
                calendarInitialized: "Takvim başlatıldı!",
                enterTaskTitle: "Lütfen bir görev başlığı girin",
                enterProjectName: "Lütfen bir proje adı girin",
                deleteTaskConfirm: "Bu görevi silmek istediğinize emin misiniz?",
                deleteProjectConfirm: "Projeyi sil? Görevler korunacak ancak projesiz olacak.",
                deleteSelectedConfirm: "Seçili görevleri sil?",
                logoutConfirm: "Çıkış yapmak istediğinize emin misiniz?",
                clearDataConfirm: "Tüm verileri temizle? Bu işlem geri alınamaz!",
                loginToTaskly: "Taskly'e Giriş Yap",
                username: "Kullanıcı Adı",
                password: "Şifre",
                demoCredentials: "Demo Giriş Bilgileri:",
                orJustClick: "Veya sadece Giriş Yap'a tıklayın",
                chartCompletionTrend: "Görev Tamamlama Trendi"
            }
        };

        this.currentLanguage = translations[language] || translations.en;
        this.updateUITranslations();
    }

    updateUITranslations() {
        const t = this.currentLanguage;

        // Update page titles and subtitles
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');

        if (pageTitle && pageSubtitle) {
            if (this.currentView === 'dashboard') {
                pageSubtitle.textContent = t.welcomeBack;
            }
        }

        // Update navigation
        const navElements = {
            'data-view="dashboard"': t.dashboard,
            'data-view="today"': t.today,
            'data-view="calendar"': t.calendar,
            'data-view="all-tasks"': t.allTasks,
            'data-view="completed"': t.completedTasks
        };

        Object.entries(navElements).forEach(([selector, text]) => {
            const element = document.querySelector(`.nav-link[${selector}] span`);
            if (element) {
                element.textContent = text;
            }
        });

        // Update section headers
        const sectionHeaders = document.querySelectorAll('.nav-section h3');
        if (sectionHeaders.length >= 3) {
            sectionHeaders[0].textContent = t.overview;
            sectionHeaders[1].textContent = t.projects;
            sectionHeaders[2].textContent = t.tasks;
        }

        // Update quick action buttons
        const quickAddBtn = document.getElementById('quick-add-task');
        const newProjectBtn = document.getElementById('quick-add-project');
        if (quickAddBtn) {
            const span = quickAddBtn.querySelector('span');
            if (span) span.textContent = t.quickAdd;
        }
        if (newProjectBtn) {
            const span = newProjectBtn.querySelector('span');
            if (span) span.textContent = t.newProject;
        }

        // Update settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            const span = settingsBtn.querySelector('span');
            if (span) span.textContent = t.settings;
        }

        // Update top bar buttons
        const selectAllBtn = document.querySelector('.select-all-btn');
        const deleteSelectedBtn = document.querySelector('.delete-selected-btn');
        if (selectAllBtn) selectAllBtn.textContent = t.selectAll;
        if (deleteSelectedBtn) deleteSelectedBtn.textContent = t.deleteSelected;

        // Update dashboard stats
        const statCards = document.querySelectorAll('.stat-content p');
        if (statCards.length >= 4) {
            statCards[0].textContent = t.totalTasks;
            statCards[1].textContent = t.completed;
            statCards[2].textContent = t.pending;
            statCards[3].textContent = t.projects;
        }

        // Update dashboard section titles
        const dashboardTitles = document.querySelectorAll('.dashboard-section h3');
        if (dashboardTitles.length >= 2) {
            dashboardTitles[0].textContent = t.todaysTasks;
            dashboardTitles[1].textContent = t.recentProjects;
        }

        // Update modal titles and labels
        this.updateModalTranslations(t);

        // Update settings tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach((btn, index) => {
            if (index === 0) btn.textContent = t.profile;
            else if (index === 1) btn.textContent = t.preferences;
            else if (index === 2) btn.textContent = t.data;
            else if (index === 3) btn.textContent = t.about;
        });
    }

    updateModalTranslations(t) {
        // Add Task Modal
        const addTaskModal = document.getElementById('add-task-modal');
        if (addTaskModal) {
            const title = addTaskModal.querySelector('h3');
            if (title) title.textContent = t.addNewTask;

            const labels = addTaskModal.querySelectorAll('label');
            labels.forEach(label => {
                const forAttr = label.getAttribute('for');
                if (forAttr === 'task-title') label.textContent = t.taskTitle;
                else if (forAttr === 'task-description') label.textContent = t.description;
                else if (forAttr === 'task-priority') label.textContent = t.priority;
                else if (forAttr === 'task-due-date') label.textContent = t.dueDate;
                else if (forAttr === 'task-project') label.textContent = t.project;
                else if (forAttr === 'task-labels') label.textContent = t.labels;
            });

            const buttons = addTaskModal.querySelectorAll('.modal-actions button');
            if (buttons.length >= 2) {
                buttons[0].textContent = t.cancel;
                buttons[1].textContent = t.addTask;
            }
        }

        // Add Project Modal
        const addProjectModal = document.getElementById('add-project-modal');
        if (addProjectModal) {
            const title = addProjectModal.querySelector('h3');
            if (title) title.textContent = t.addNewProject;

            const labels = addProjectModal.querySelectorAll('label');
            labels.forEach(label => {
                const forAttr = label.getAttribute('for');
                if (forAttr === 'project-name') label.textContent = t.projectName;
                else if (forAttr === 'project-description') label.textContent = t.projectDescription;
                else if (forAttr === 'project-color') label.textContent = t.projectColor;
            });

            const buttons = addProjectModal.querySelectorAll('.modal-actions button');
            if (buttons.length >= 2) {
                buttons[0].textContent = t.cancel;
                buttons[1].textContent = t.createProject;
            }
        }
    }

    toggleSidebar() {
        document.querySelector('.sidebar').classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
    }

    showView(view) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Find and activate the correct link
        let activeLink;
        if (view === 'project' && this.currentProjectId) {
            activeLink = document.querySelector(`.nav-link[data-view="project"][data-project-id="${this.currentProjectId}"]`);
        } else {
            activeLink = document.querySelector(`.nav-link[data-view="${view}"]`);
        }

        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

        // Show selected view
        const selectedView = document.getElementById(`${view}-view`);
        if (selectedView) {
            selectedView.classList.add('active');
        }

        // Update page title
        const t = this.currentLanguage;
        const titles = {
            dashboard: t.dashboard,
            today: t.today,
            calendar: t.calendar,
            project: "Project",
            'all-tasks': t.allTasks,
            completed: t.completedTasks
        };

        if (view === 'project' && this.currentProjectId) {
            const project = this.projects.find(p => p.id === this.currentProjectId);
            document.getElementById('page-title').textContent = project ? `${project.name}` : t.tasks;
        } else {
            document.getElementById('page-title').textContent = titles[view] || t.tasks;
        }

        this.currentView = view;
        this.renderCurrentView();
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'today':
                this.renderToday();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'project':
                this.renderProject();
                break;
            case 'all-tasks':
                this.renderAllTasks();
                break;
            case 'completed':
                this.renderCompleted();
                break;
        }
    }

    renderDashboard() {
        const t = this.currentLanguage;
        const todayTasks = this.getTodayTasks();
        const todayTasksList = document.getElementById('today-tasks-list');
        if (todayTasksList) {
            todayTasksList.innerHTML = todayTasks.length > 0
                ? todayTasks.slice(0, 5).map(task => this.createTaskHTML(task)).join('')
                : `<p class="empty-state">${t.noTasksToday}</p>`;
        }

        const recentProjects = this.projects.slice(-3);
        const recentProjectsList = document.getElementById('recent-projects-list');
        if (recentProjectsList) {
            recentProjectsList.innerHTML = recentProjects.length > 0
                ? recentProjects.map(project => this.createProjectHTML(project)).join('')
                : `<p class="empty-state">${t.noProjects}</p>`;
        }

        // Initialize or update charts
        if (!this.completionChart || !this.statusChart) {
            this.initializeCharts();
        } else {
            this.updateCharts();
        }
    }

    renderProject() {
        const t = this.currentLanguage;
        const projectTitleEl = document.getElementById('project-title');
        const projectTasksEl = document.getElementById('project-tasks');
        const project = this.projects.find(p => p.id === this.currentProjectId);

        if (projectTitleEl) {
            projectTitleEl.textContent = project ? `${project.name} — ${t.tasks}` : t.tasks;
        }

        if (projectTasksEl) {
            const tasks = this.tasks.filter(t => t.projectId === this.currentProjectId);
            projectTasksEl.innerHTML = tasks.length > 0
                ? tasks.map(task => this.createTaskHTML(task)).join('')
                : `<p class="empty-state">${t.noTasksProject}</p>`;
        }
    }

    renderToday() {
        const t = this.currentLanguage;
        const todayTasks = this.getTodayTasks();
        const todayTasksContainer = document.getElementById('today-tasks');
        if (todayTasksContainer) {
            todayTasksContainer.innerHTML = todayTasks.length > 0
                ? todayTasks.map(task => this.createTaskHTML(task)).join('')
                : `<p class="empty-state">${t.enjoyFreeTime}</p>`;
        }
    }

    renderCalendar() {
        // Initialize or update calendar
        if (!this.calendar) {
            this.initCalendar();
        } else {
            this.updateCalendar();
        }
    }

    renderAllTasks() {
        const t = this.currentLanguage;
        const allTasksContainer = document.getElementById('all-tasks');
        if (allTasksContainer) {
            allTasksContainer.innerHTML = this.tasks.length > 0
                ? this.tasks.map(task => this.createTaskHTML(task)).join('')
                : `<p class="empty-state">${t.noTasks}</p>`;
        }
    }

    renderCompleted() {
        const t = this.currentLanguage;
        const completedTasks = this.tasks.filter(task => task.status === 'completed');
        const completedContainer = document.getElementById('completed-tasks');

        if (completedContainer) {
            if (completedTasks.length > 0) {
                completedContainer.innerHTML = completedTasks.map(task => this.createTaskHTML(task)).join('');
            } else {
                completedContainer.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-light);">
                        <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 16px; color: var(--success-color);"></i>
                        <h3 style="margin-bottom: 8px; color: var(--text-primary);">${t.noCompleted}</h3>
                        <p>${t.noCompletedDesc}</p>
                    </div>
                `;
            }
        }
    }

    initializeCharts() {
        this.initializeCompletionChart();
        this.initializeStatusChart();
    }

    initializeCompletionChart() {
        const ctx = document.getElementById('completion-chart');
        if (!ctx) return;

        // Get current theme
        const theme = localStorage.getItem('taskly-theme') || 'light';
        const isDarkMode = theme === 'dark';

        // Get completion data for the last 7 days
        const completionData = this.getCompletionDataForLast7Days();

        this.completionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: completionData.dates,
                datasets: [{
                    label: this.currentLanguage.chartCompletionTrend,
                    data: completionData.counts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: isDarkMode ? '#ffffff' : '#2c3e50', // ONLY change dark mode
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDarkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.8)',
                        titleColor: isDarkMode ? '#000000' : '#ffffff',
                        bodyColor: isDarkMode ? '#000000' : '#ffffff',
                        borderColor: isDarkMode ? '#dee2e6' : 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y} tasks`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: isDarkMode ? '#cccccc' : '#666666', // ONLY change dark mode
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: isDarkMode ? '#cccccc' : '#666666', // ONLY change dark mode
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            },
                            precision: 0,
                            stepSize: 1
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    initializeStatusChart() {
        const ctx = document.getElementById('status-chart');
        if (!ctx) return;

        // Check if this is first time showing chart (for special animation)
        const hasSeenChart = localStorage.getItem('taskly-has-seen-chart');
        const isFirstView = !hasSeenChart;

        // Mark that user has seen the chart
        if (isFirstView) {
            localStorage.setItem('taskly-has-seen-chart', 'true');
        }

        // Get current theme
        const theme = localStorage.getItem('taskly-theme') || 'light';
        const isDarkMode = theme === 'dark';

        // Get task status data
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
        const pendingTasks = totalTasks - completedTasks;

        const t = this.currentLanguage;

        this.statusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [t.completed, t.pending],
                datasets: [{
                    data: [completedTasks, pendingTasks],
                    backgroundColor: [
                        '#4caf50',
                        '#ff9800'
                    ],
                    borderColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: isDarkMode ? '#ffffff' : '#2c3e50',
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: isDarkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.8)',
                        titleColor: isDarkMode ? '#000000' : '#ffffff',
                        bodyColor: isDarkMode ? '#000000' : '#ffffff',
                        borderColor: isDarkMode ? '#dee2e6' : 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = totalTasks > 0 ? Math.round((value / totalTasks) * 100) : 0;
                                return `${label}: ${value} tasks (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: isFirstView, // Only animate scale on first view
                    animateRotate: true, // Always animate rotation
                    duration: isFirstView ? 2000 : 1000, // Longer on first view
                    easing: isFirstView ? 'easeOutElastic' : 'easeOutQuart' // Bouncy animation on first view
                }
            }
        });
    }

    getCompletionDataForLast7Days() {
        const dates = [];
        const counts = [];

        // Get today's date
        const today = new Date();

        // Generate labels for last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            // Format date for display (short version)
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            dates.push(formattedDate);

            // Format date for comparison with task dates
            const dateStr = date.toISOString().split('T')[0];

            // Count tasks completed on this day
            const completedOnDay = this.tasks.filter(task => {
                if (task.completedAt) {
                    const taskDate = new Date(task.completedAt).toISOString().split('T')[0];
                    return taskDate === dateStr;
                }
                return false;
            }).length;

            counts.push(completedOnDay);
        }

        return { dates, counts };
    }

    refreshCharts() {
        if (this.completionChart && this.statusChart) {
            this.updateCharts();
        }
    }

    updateCharts() {
        if (this.completionChart) {
            const completionData = this.getCompletionDataForLast7Days();
            this.completionChart.data.labels = completionData.dates;
            this.completionChart.data.datasets[0].data = completionData.counts;
            this.completionChart.update();
        }

        if (this.statusChart) {
            const totalTasks = this.tasks.length;
            const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
            const pendingTasks = totalTasks - completedTasks;

            this.statusChart.data.datasets[0].data = [completedTasks, pendingTasks];
            this.statusChart.update();
        }
    }

    getTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        return this.tasks.filter(task => task.dueDate && task.dueDate === today);
    }

    createTaskHTML(task) {
        const t = this.currentLanguage;
        const priorityClass = task.priority || 'medium';
        const isCompleted = task.status === 'completed';
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const projectName = task.projectId ? this.getProjectName(task.projectId) : '';
        const priorityText = task.priority === 'high' ? t.high :
            task.priority === 'medium' ? t.medium : t.low;

        return `
            <div class="task-item ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" class="task-check" ${isCompleted ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${priorityClass}">${priorityText}</span>
                        ${dueDate ? `<span class="task-due-date">${t.dueDate}: ${dueDate}</span>` : ''}
                        ${projectName ? `<span class="task-project">${this.escapeHtml(projectName)}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action task-edit" title="${t.addNewTask}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action task-delete" title="${t.deleteSelected}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    createProjectHTML(project) {
        const t = this.currentLanguage;
        const taskCount = this.tasks.filter(t => t.projectId === project.id).length;
        return `
            <div class="project-item" data-project-id="${project.id}">
                <div class="project-color" style="background-color: ${project.color}"></div>
                <div class="project-name">${this.escapeHtml(project.name)}</div>
                <div class="project-description">${this.escapeHtml(project.description || '')}</div>
                <div class="project-stats">
                    <span>${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}</span>
                    <span>${new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }

    openAddTaskModal() {
        this.populateProjectSelect();
        this.showModal('add-task-modal');
    }

    openAddProjectModal() {
        this.showModal('add-project-modal');
    }

    openSettings() {
        this.loadSettingsData();
        this.showModal('settings-modal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';

            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    populateProjectSelect() {
        const select = document.getElementById('task-project');
        if (select) {
            select.innerHTML = '<option value="">No Project</option>' +
                this.projects.map(project =>
                    `<option value="${project.id}">${this.escapeHtml(project.name)}</option>`
                ).join('');
        }
    }

    switchSettingsTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabId}-tab`);
        });
    }

    loadSettingsData() {
        // Load profile
        document.getElementById('settings-user-name').value =
            localStorage.getItem('taskly-user-name') || '';
        document.getElementById('settings-user-email').value =
            localStorage.getItem('taskly-user-email') || '';
        document.getElementById('settings-user-avatar').value =
            localStorage.getItem('taskly-user-avatar') || '';

        // Update avatar preview
        const avatarPreview = document.getElementById('avatar-preview');
        const avatarUrl = localStorage.getItem('taskly-user-avatar');
        if (avatarUrl && avatarUrl.trim() !== '') {
            avatarPreview.src = avatarUrl;
            avatarPreview.style.display = 'block';
        } else {
            avatarPreview.style.display = 'none';
        }

        // Load preferences
        document.getElementById('settings-theme').value =
            localStorage.getItem('taskly-theme') || 'light';
        document.getElementById('settings-language').value =
            localStorage.getItem('taskly-language') || 'en';
        document.getElementById('settings-date-format').value =
            localStorage.getItem('taskly-date-format') || 'mm/dd/yyyy';
        document.getElementById('settings-time-format').value =
            localStorage.getItem('taskly-time-format') || '12';
        document.getElementById('settings-notifications').checked =
            localStorage.getItem('taskly-notifications') !== 'false';
        document.getElementById('settings-auto-save').checked =
            localStorage.getItem('taskly-auto-save') !== 'false';

        // Load data stats
        this.updateSettingsStats();
    }

    updateSettingsStats() {
        const t = this.currentLanguage;

        document.getElementById('settings-total-tasks').textContent = this.tasks.length;
        document.getElementById('settings-total-projects').textContent = this.projects.length;
        document.getElementById('settings-completed-tasks').textContent =
            this.tasks.filter(t => t.status === 'completed').length;

        // Calculate storage
        const userKey = `taskly-user-${this.currentUser.id}`;
        const userData = localStorage.getItem(userKey) || '{}';
        const storageUsed = userData.length;
        document.getElementById('settings-storage-used').textContent =
            Math.round(storageUsed / 1024) + ' KB';

        // Update labels in settings tab
        const statItems = document.querySelectorAll('.stat-item p');
        if (statItems.length >= 4) {
            statItems[0].textContent = t.totalTasksStat;
            statItems[1].textContent = t.totalProjectsStat;
            statItems[2].textContent = t.completedTasksStat;
            statItems[3].textContent = t.storageUsed;
        }
    }

    handleAddTask(e) {
        e.preventDefault();

        const t = this.currentLanguage;
        const taskTitle = document.getElementById('task-title').value.trim();
        if (!taskTitle) {
            this.showNotification(t.enterTaskTitle, 'error');
            return;
        }

        const task = {
            id: this.nextTaskId++,
            title: taskTitle,
            description: document.getElementById('task-description').value.trim(),
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            projectId: document.getElementById('task-project').value ?
                parseInt(document.getElementById('task-project').value) : null,
            labels: document.getElementById('task-labels').value ?
                document.getElementById('task-labels').value.split(',').map(l => l.trim()) : [],
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.push(task);
        this.saveData();
        this.refreshCharts();
        this.closeModal('add-task-modal');
        this.renderCurrentView();
        this.updateStats();
        this.updateSidebar();
        this.showNotification(t.taskAdded, 'success');
    }

    handleAddProject(e) {
        e.preventDefault();

        const t = this.currentLanguage;
        const projectName = document.getElementById('project-name').value.trim();
        if (!projectName) {
            this.showNotification(t.enterProjectName, 'error');
            return;
        }

        const project = {
            id: this.nextProjectId++,
            name: projectName,
            description: document.getElementById('project-description').value.trim(),
            color: document.getElementById('project-color').value,
            createdAt: new Date().toISOString()
        };

        this.projects.push(project);
        this.saveData();
        this.refreshCharts();
        this.closeModal('add-project-modal');
        this.updateSidebar();
        this.updateStats();
        this.showNotification(t.projectCreated, 'success');
    }

    toggleTask(checkbox) {
        const t = this.currentLanguage;
        const taskItem = checkbox.closest('.task-item');
        const taskId = parseInt(taskItem.dataset.taskId);
        const task = this.tasks.find(t => t.id === taskId);

        if (task) {
            task.status = checkbox.checked ? 'completed' : 'pending';
            task.completedAt = checkbox.checked ? new Date().toISOString() : null;

            taskItem.classList.toggle('completed', checkbox.checked);

            this.saveData();
            this.refreshCharts();
            this.updateStats();
            this.updateSidebar();

            this.showNotification(
                checkbox.checked ? t.taskCompleted : t.taskPending,
                'success'
            );
        }
    }

    editTask(button) {
        const t = this.currentLanguage;
        const taskItem = button.closest('.task-item');
        const taskId = parseInt(taskItem.dataset.taskId);
        const task = this.tasks.find(t => t.id === taskId);

        if (task) {
            const newTitle = prompt(t.addNewTask + ':', task.title);
            if (newTitle && newTitle.trim() !== task.title) {
                task.title = newTitle.trim();
                this.saveData();
                this.renderCurrentView();
                this.showNotification(t.taskUpdated, 'success');
            }
        }
    }

    deleteTask(button) {
        const t = this.currentLanguage;
        const taskItem = button.closest('.task-item');
        const taskId = parseInt(taskItem.dataset.taskId);

        if (confirm(t.deleteTaskConfirm)) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.refreshCharts();
            this.renderCurrentView();
            this.updateStats();
            this.updateSidebar();
            this.showNotification(t.taskDeleted, 'success');
        }
    }

    deleteProject(projectId) {
        const t = this.currentLanguage;
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        if (confirm(`${t.deleteProjectConfirm} "${project.name}"?`)) {
            // Unassign tasks
            this.tasks = this.tasks.map(t =>
                t.projectId === projectId ? { ...t, projectId: null } : t
            );

            // Remove project
            this.projects = this.projects.filter(p => p.id !== projectId);

            // Switch view if needed
            if (this.currentProjectId === projectId) {
                this.currentProjectId = null;
                this.showView('all-tasks');
            }

            this.saveData();
            this.refreshCharts();
            this.updateSidebar();
            this.updateStats();
            this.renderCurrentView();
            this.showNotification(t.projectDeleted, 'success');
        }
    }

    selectAllTasks() {
        const t = this.currentLanguage;
        const taskCheckboxes = document.querySelectorAll('.task-check');
        taskCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.toggleTask(checkbox);
        });
        this.showNotification(t.allTasksCompleted, 'info');
    }

    deleteSelectedTasks() {
        const t = this.currentLanguage;
        const selectedTasks = Array.from(document.querySelectorAll('.task-check:checked'));

        if (selectedTasks.length === 0) {
            this.showNotification(t.noTasksSelected, 'warning');
            return;
        }

        if (confirm(`${t.deleteSelectedConfirm} (${selectedTasks.length})?`)) {
            selectedTasks.forEach(checkbox => {
                const taskItem = checkbox.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);
                this.tasks = this.tasks.filter(t => t.id !== taskId);
            });

            this.saveData();
            this.refreshCharts();
            this.renderCurrentView();
            this.updateStats();
            this.updateSidebar();
            this.showNotification(`${selectedTasks.length} ${t.taskDeleted}`, 'success');
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('pending-tasks').textContent = pendingTasks;
        document.getElementById('total-projects').textContent = this.projects.length;

        // Update sidebar badges
        document.getElementById('today-count').textContent = this.getTodayTasks().length;
        document.getElementById('all-tasks-count').textContent = totalTasks;
        document.getElementById('completed-count').textContent = completedTasks;
    }

    updateSidebar() {
        const t = this.currentLanguage;
        const projectsList = document.getElementById('projects-list');
        if (projectsList) {
            projectsList.innerHTML = this.projects.map(project => {
                const count = this.tasks.filter(t => t.projectId === project.id).length;
                return `
                <li>
                    <a href="#" class="nav-link" data-view="project" data-project-id="${project.id}">
                        <i class="fas fa-folder" style="color: ${project.color}"></i>
                        <span>${this.escapeHtml(project.name)}</span>
                        <span class="badge">${count}</span>
                    </a>
                    <button class="project-delete-btn" title="${t.deleteSelected}" data-project-id="${project.id}" 
                        style="background:none;border:none;color:var(--text-light);margin-left:6px;cursor:pointer;padding:2px;border-radius:4px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </li>`;
            }).join('');
        }
    }

    updateLoginUI() {
        const userInfo = document.getElementById('user-info');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');

        const savedName = localStorage.getItem('taskly-user-name') || 'User';
        const savedAvatar = localStorage.getItem('taskly-user-avatar');

        if (userName) userName.textContent = savedName;
        if (userAvatar && savedAvatar && savedAvatar.trim() !== '') {
            userAvatar.src = savedAvatar;
            userAvatar.style.display = 'block';
        }

        const isLoggedIn = localStorage.getItem('taskly-logged-in') === 'true';
        if (userInfo) userInfo.style.display = isLoggedIn ? 'flex' : 'none';
        if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'flex';
        if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'flex' : 'none';
    }

    applyTheme() {
        const theme = localStorage.getItem('taskly-theme') || 'light';
        const root = document.documentElement;

        if (theme === 'dark') {
            root.style.setProperty('--background-primary', '#1a1a1a');
            root.style.setProperty('--background-secondary', '#2d2d2d');
            root.style.setProperty('--background-tertiary', '#3d3d3d');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#cccccc');
            root.style.setProperty('--text-light', '#888888');
            root.style.setProperty('--border-color', '#444444');
        } else {
            root.style.setProperty('--background-primary', '#ffffff');
            root.style.setProperty('--background-secondary', '#f8f9fa');
            root.style.setProperty('--background-tertiary', '#e9ecef');
            root.style.setProperty('--text-primary', '#2c3e50');
            root.style.setProperty('--text-secondary', '#6c757d');
            root.style.setProperty('--text-light', '#adb5bd');
            root.style.setProperty('--border-color', '#dee2e6');
        }
    }

    initCalendar() {
        const t = this.currentLanguage;
        const calendarEl = document.getElementById('calendar-container');
        if (calendarEl && typeof FullCalendar !== 'undefined') {
            // Get tasks with due dates
            const events = this.tasks
                .filter(task => task.dueDate)
                .map(task => ({
                    id: task.id.toString(),
                    title: task.title,
                    start: task.dueDate,
                    backgroundColor: this.getPriorityColor(task.priority),
                    borderColor: this.getPriorityColor(task.priority),
                    textColor: '#ffffff',
                    extendedProps: {
                        description: task.description,
                        priority: task.priority,
                        projectId: task.projectId,
                        completed: task.status === 'completed'
                    }
                }));

            // Initialize FullCalendar
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                initialDate: new Date(),
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek,dayGridDay'
                },
                events: events,
                dateClick: (info) => {
                    this.handleDateClick(info);
                },
                eventClick: (info) => {
                    this.handleEventClick(info);
                },
                height: 'auto',
                aspectRatio: 1.5,
                dayMaxEventRows: 3,
                eventDisplay: 'block'
            });

            this.calendar.render();
            this.showNotification(t.calendarInitialized, 'success');
        } else {
            console.error('FullCalendar not loaded or calendar container not found');
            this.showNotification('Calendar failed to load. Please refresh.', 'error');
        }
    }

    getPriorityColor(priority) {
        const colors = {
            high: '#dc3545',  // Red
            medium: '#ffc107', // Yellow
            low: '#28a745'    // Green
        };
        return colors[priority] || '#667eea'; // Default blue
    }

    handleDateClick(info) {
        // Open add task modal with pre-filled date
        this.openAddTaskModal();

        // Set the date in the form
        setTimeout(() => {
            const dateInput = document.getElementById('task-due-date');
            if (dateInput) {
                dateInput.value = info.dateStr;
            }
        }, 100);
    }

    handleEventClick(info) {
        const t = this.currentLanguage;
        const taskId = parseInt(info.event.id);
        const task = this.tasks.find(t => t.id === taskId);

        if (task) {
            const projectName = task.projectId ? this.getProjectName(task.projectId) : 'No Project';
            const status = task.status === 'completed' ? t.completed : t.pending;
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : t.dueDate + ': None';

            const message = `${t.taskTitle}: ${task.title}\n${t.description}: ${task.description || 'None'}\n${t.priority}: ${task.priority || 'Medium'}\n${t.tasks}: ${status}\n${t.dueDate}: ${dueDate}\n${t.project}: ${projectName}`;

            if (confirm(`${message}\n\nEdit this task?`)) {
                this.editTaskById(taskId);
            }
        }
    }

    editTaskById(taskId) {
        const t = this.currentLanguage;
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newTitle = prompt(t.addNewTask + ':', task.title);
        if (newTitle && newTitle.trim() !== task.title) {
            task.title = newTitle.trim();
            this.saveData();
            this.refreshCharts();
            this.updateCalendar();
            this.renderCurrentView();
            this.showNotification(t.taskUpdated, 'success');
        }
    }

    updateCalendar() {
        if (this.calendar) {
            // Get updated events
            const events = this.tasks
                .filter(task => task.dueDate)
                .map(task => ({
                    id: task.id.toString(),
                    title: task.title,
                    start: task.dueDate,
                    backgroundColor: this.getPriorityColor(task.priority),
                    borderColor: this.getPriorityColor(task.priority),
                    textColor: '#ffffff',
                    extendedProps: {
                        description: task.description,
                        priority: task.priority,
                        projectId: task.projectId,
                        completed: task.status === 'completed'
                    }
                }));

            // Remove all events and add new ones
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(events);
        }
    }

    getProjectName(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        return project ? project.name : '';
    }

    handleLogin() {
        window.location.href = 'login.html';
    }

    handleLogout() {
        const t = this.currentLanguage;
        if (confirm(t.logoutConfirm)) {
            localStorage.removeItem('taskly-logged-in');
            localStorage.removeItem('taskly-current-user');
            window.location.href = 'login.html';
        }
    }

    // Data persistence
    saveData() {
        const userKey = `taskly-user-${this.currentUser.id}`;
        const userData = {
            tasks: this.tasks,
            projects: this.projects,
            nextTaskId: this.nextTaskId,
            nextProjectId: this.nextProjectId
        };
        localStorage.setItem(userKey, JSON.stringify(userData));

        // Update calendar if it exists
        if (this.calendar) {
            this.updateCalendar();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
let taskManager;

function initApp() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('taskly-current-user'));
    const isLoggedIn = localStorage.getItem('taskly-logged-in') === 'true';

    if (!currentUser || !currentUser.id || !isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    taskManager = new TaskManager();
}

// Global functions for settings
function saveProfile() {
    const name = document.getElementById('settings-user-name').value.trim();
    const email = document.getElementById('settings-user-email').value.trim();
    const avatar = document.getElementById('settings-user-avatar').value.trim();

    if (name) {
        localStorage.setItem('taskly-user-name', name);
        localStorage.setItem('taskly-user-email', email);

        if (avatar) {
            localStorage.setItem('taskly-user-avatar', avatar);
            const avatarPreview = document.getElementById('avatar-preview');
            avatarPreview.src = avatar;
            avatarPreview.style.display = 'block';
        }

        // Update current user data if exists
        const currentUser = JSON.parse(localStorage.getItem('taskly-current-user'));
        if (currentUser) {
            currentUser.name = name;
            currentUser.email = email;
            if (avatar) currentUser.avatar = avatar;
            localStorage.setItem('taskly-current-user', JSON.stringify(currentUser));
        }

        if (taskManager) {
            const t = taskManager.currentLanguage;
            taskManager.showNotification(t.profileSaved, 'success');
            taskManager.updateLoginUI();
        }
    }
}

function savePreferences() {
    const theme = document.getElementById('settings-theme').value;
    const language = document.getElementById('settings-language').value;
    const dateFormat = document.getElementById('settings-date-format').value;
    const timeFormat = document.getElementById('settings-time-format').value;
    const notifications = document.getElementById('settings-notifications').checked;
    const autoSave = document.getElementById('settings-auto-save').checked;

    localStorage.setItem('taskly-theme', theme);
    localStorage.setItem('taskly-language', language);
    localStorage.setItem('taskly-date-format', dateFormat);
    localStorage.setItem('taskly-time-format', timeFormat);
    localStorage.setItem('taskly-notifications', notifications);
    localStorage.setItem('taskly-auto-save', autoSave);

    // Update current user settings if exists
    const currentUser = JSON.parse(localStorage.getItem('taskly-current-user'));
    if (currentUser) {
        if (!currentUser.settings) currentUser.settings = {};
        currentUser.settings.theme = theme;
        currentUser.settings.language = language;
        localStorage.setItem('taskly-current-user', JSON.stringify(currentUser));
    }

    if (taskManager) {
        taskManager.applyTheme();
        taskManager.applyLanguage();
        taskManager.updateSettingsStats();
        const t = taskManager.currentLanguage;
        taskManager.showNotification(t.preferencesSaved, 'success');
    }
}

function exportData() {
    if (!taskManager || !taskManager.currentUser) return;

    const userKey = `taskly-user-${taskManager.currentUser.id}`;
    const userData = JSON.parse(localStorage.getItem(userKey)) || {};

    const exportData = {
        tasks: userData.tasks || [],
        projects: userData.projects || [],
        exportDate: new Date().toISOString(),
        exportedBy: taskManager.currentUser.name || 'User',
        userEmail: taskManager.currentUser.email || ''
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskly-backup-${taskManager.currentUser.name || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (taskManager) {
        const t = taskManager.currentLanguage;
        taskManager.showNotification(t.dataExported, 'success');
    }
}

function importData() {
    document.getElementById('import-file').click();
}

document.getElementById('import-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.tasks && data.projects && taskManager && taskManager.currentUser) {
                const userKey = `taskly-user-${taskManager.currentUser.id}`;
                const currentData = JSON.parse(localStorage.getItem(userKey)) || {};

                currentData.tasks = data.tasks;
                currentData.projects = data.projects;
                currentData.nextTaskId = Math.max(...data.tasks.map(t => t.id), 0) + 1;
                currentData.nextProjectId = Math.max(...data.projects.map(p => p.id), 0) + 1;

                localStorage.setItem(userKey, JSON.stringify(currentData));

                taskManager.tasks = data.tasks;
                taskManager.projects = data.projects;
                taskManager.nextTaskId = currentData.nextTaskId;
                taskManager.nextProjectId = currentData.nextProjectId;

                taskManager.saveData();
                taskManager.renderCurrentView();
                taskManager.updateStats();
                taskManager.updateSidebar();
                const t = taskManager.currentLanguage;
                taskManager.showNotification(t.dataImported, 'success');
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error('Import error:', error);
            if (taskManager) {
                const t = taskManager.currentLanguage;
                taskManager.showNotification('Error importing data: Invalid file format', 'error');
            }
        }
    };
    reader.readAsText(file);
});

function clearAllData() {
    const t = taskManager ? taskManager.currentLanguage : { clearDataConfirm: "Clear all data? This cannot be undone!" };
    if (confirm(t.clearDataConfirm)) {
        if (taskManager && taskManager.currentUser) {
            const userKey = `taskly-user-${taskManager.currentUser.id}`;

            // Create fresh user data structure
            const freshData = {
                tasks: [],
                projects: [],
                nextTaskId: 1,
                nextProjectId: 1
            };

            localStorage.setItem(userKey, JSON.stringify(freshData));

            taskManager.tasks = [];
            taskManager.projects = [];
            taskManager.nextTaskId = 1;
            taskManager.nextProjectId = 1;
            taskManager.saveData();
            taskManager.renderCurrentView();
            taskManager.updateStats();
            taskManager.updateSidebar();
            taskManager.showNotification(t.allDataCleared, 'success');
        }
    }
}

function checkUpdates() {
    if (taskManager) {
        const t = taskManager.currentLanguage;
        taskManager.showNotification(t.latestVersion, 'info');
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const toggle = document.getElementById("sidebar-toggle");

    if (toggle && sidebar) {
        toggle.addEventListener("click", function () {
            sidebar.classList.toggle("show");
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", function (e) {
        if (sidebar.classList.contains("show") &&
            !sidebar.contains(e.target) &&
            e.target !== toggle
        ) {
            sidebar.classList.remove("show");
        }
    });
});
