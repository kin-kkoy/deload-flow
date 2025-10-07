"use strict";

// ========== DOM refs ==========
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const retrieveTaskBtn = document.getElementById("retrieveTaskBtn");
const taskDisplay = document.getElementById("taskDisplay");
const urgencyFilterBtn = document.getElementById("sortUrgency");
const difficultyFilterBtn = document.getElementById("sortDifficulty");
const streamlineMode = document.getElementById("streamlineMode");
const taskStats = document.getElementById("taskStats");

// Auth elements
const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const loginFormEl = document.getElementById("loginForm");
const registerFormEl = document.getElementById("registerForm");
const loginErrorEl = document.getElementById("loginError");
const registerErrorEl = document.getElementById("registerError");
const logoutBtn = document.getElementById("logoutBtn");
const authTabs = document.querySelectorAll(".auth-tab");

// ========== Config & State ==========
const STORAGE_KEYS = { tasks: "tasks", token: "token" };
const API_BASE = window.__API_URL || "http://localhost:5001"; // change if your backend runs elsewhere

const state = {
    tasks: [],
    filters: { urgency: "all", difficulty: "all" },
    streamline: true,
    token: localStorage.getItem(STORAGE_KEYS.token) || null,
};

// ========== Storage helpers ==========
function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
}

function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEYS.tasks);
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        // ensure every task has an id
        state.tasks = (Array.isArray(parsed) ? parsed : []).map((t) => ({
            id: t.id || cryptoId(),
            name: t.name || "Untitled",
            urgency: t.urgency || "later",
            difficulty: t.difficulty || "Easy",
            deadlineDate: t.deadlineDate || "",
            deadlineTime: t.deadlineTime || "",
            completed: Boolean(t.completed),
            autoUrgency: Boolean(t.autoUrgency),
            scope: t.scope || "small",
            dateCreated: t.dateCreated || new Date().toISOString(),
        }));
    } catch (_) {
        state.tasks = [];
    }
}

function cryptoId() {
    // Prefer UUID, fallback to timestamp-based id
    return (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// ========== Auth / API client ==========
function setToken(t, persist = true) {
    state.token = t;
    if (persist) localStorage.setItem(STORAGE_KEYS.token, t);
}

function clearToken() {
    state.token = null;
    localStorage.removeItem(STORAGE_KEYS.token);
}

async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
}

async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
    if (state.token) headers.set("Authorization", `Bearer ${state.token}`);

    const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!resp.ok) {
        const body = await safeJson(resp);
        const msg = body.error || `Request failed (${resp.status})`;
        throw new Error(msg);
    }
    return resp.json();
}

const api = {
    // switch these to your real endpoints when backend is ready
    async login(username, password) {
        // e.g., /auth/signin or /auth/login
        return apiFetch("/auth/signin", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
    },
    async register(name, username, password) {
        // e.g., /auth/signup or /auth/register
        return apiFetch("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ name, username, password }),
        });
    },
    async getTasks() {
        // Update to your backend route, e.g., /todo
        return apiFetch("/todo", { method: "GET" });
    },
};

// ========== UI helpers ==========
function getDaysLeft(task) {
    if (!task.deadlineDate) return null; // no deadline
    const time = task.deadlineTime && task.deadlineTime.length > 0 ? task.deadlineTime : "23:59";
    const deadline = new Date(`${task.deadlineDate}T${time}`);
    if (isNaN(deadline)) return null;
    return (deadline - Date.now()) / 86400000; // ms in a day
}

function dynamicUrgency(task) {
    const dayGap = getDaysLeft(task);
    if (dayGap === null) return task.urgency; // fallback if no deadline

    const scope = task.scope || "small";
    const urgentGap = 1, soonGap = 5; // 0-1 = urgent, 2-5 = soon, 5+ = later

    let multiplier = 1;
    if (scope === "medium") multiplier = 2;
    if (scope === "big") multiplier = 3;

    if (dayGap < 0 || dayGap <= urgentGap * multiplier) return "urgent"; // overdue = urgent
    if (dayGap > urgentGap * multiplier && dayGap <= soonGap * multiplier) return "soon";
    return "later";
}

function getDisplayUrgency(task) {
    if (task.autoUrgency && !task.completed) return dynamicUrgency(task);
    return task.urgency;
}

function updateCompletedTasks() {
    const finishedTasks = state.tasks.filter((t) => t.completed).length;
    if (taskStats) taskStats.textContent = `You've completed ${finishedTasks} tasks since you first started!`;
}

function renderTasks() {
    if (!taskDisplay) return;

    if (state.tasks.length === 0) {
        taskDisplay.innerHTML = `<p class="no-tasks-message">No tasks yet. Add one above!</p>`;
        updateCompletedTasks();
        return;
    }

    let tasksToShow = state.tasks.filter((task) => {
        const urgency = getDisplayUrgency(task);
        const sameUrgency = state.filters.urgency === "all" || urgency === state.filters.urgency;
        const sameDifficulty = state.filters.difficulty === "all" || task.difficulty === state.filters.difficulty;
        const notCompleted = !task.completed;
        return notCompleted && sameUrgency && sameDifficulty;
    });

    if (state.streamline && tasksToShow.length > 0) tasksToShow = tasksToShow.slice(0, 1);

    const tasksHTML = tasksToShow
        .map((task) => {
            const urgency = getDisplayUrgency(task);
            const daysLeft = getDaysLeft(task);

            const deadlineString = task.deadlineDate || task.deadlineTime
                ? `<strong>Due ${daysLeft >= 1 ? `in ${Math.floor(daysLeft)} days` : `Today`}!</strong>`
                : `Take your time, there's no deadline for this.`;

            const tid = String(task.id);
            return `
                <div class="task-item ${task.completed ? "completed" : ""}" data-id="${tid}">
                    <div class="task-header">
                        <div class="complete-group">
                            <input type="checkbox" class="complete-checkbox" id="complete-${tid}" ${task.completed ? "checked" : ""}>
                            <label for="complete-${tid}" class="hidden-label">Finished</label>
                        </div>
                        <div class="task-summary">
                            <span class="task-name">${task.name}</span>
                            <div class="task-categories">
                                <span class="category urgency-${urgency}">${urgency}</span>
                                <span class="category difficulty-${task.difficulty}">${task.difficulty}</span>
                            </div>
                        </div>
                        <button class="expand-btn">❯</button>
                    </div>
                    <div class="task-details">
                        <p>${deadlineString}</p>
                        <div class="task-actions">
                            <div class="action-buttons">
                                <button class="task-action-btn edit-btn" title="Edit Task">✏️</button>
                                <button class="task-action-btn delete-btn" title="Delete Task">🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

    taskDisplay.innerHTML = tasksHTML;
    updateCompletedTasks();
}

function saveEdit(taskID, title) {
    if (!title.trim()) {
        renderTasks();
        return;
    }
    const task = state.tasks.find((t) => String(t.id) === String(taskID));
    if (!task) return;
    task.name = title;
    saveTasks();
    renderTasks();
}

function editTask(taskElem) {
    const nameElem = taskElem.querySelector(".task-name");
    const taskID = taskElem.dataset.id;
    const currentNameText = nameElem.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentNameText;
    input.classList.add("edit-input");
    nameElem.textContent = "";
    nameElem.appendChild(input);
    input.focus();

    input.addEventListener("blur", () => saveEdit(taskID, input.value));
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit(taskID, input.value);
        if (e.key === "Escape") saveEdit(taskID, currentNameText);
    });
}

// ========== Event wiring ==========
taskForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const { taskName, urgency, difficulty, deadlineDate, deadlineTime, autoUrgencyToggle } = e.target.elements;
    const newTask = {
        id: cryptoId(),
        dateCreated: new Date().toISOString(),
        name: (taskName?.value || "").trim(),
        urgency: urgency?.value || "later",
        difficulty: difficulty?.value || "Easy",
        deadlineDate: deadlineDate?.value || "",
        deadlineTime: deadlineTime?.value || "",
        completed: false,
        autoUrgency: Boolean(autoUrgencyToggle?.checked),
        scope: "small",
    };

    if (!newTask.name || !newTask.urgency || !newTask.difficulty) {
        alert("Please input fields on name, urgency, and difficulty");
        if (taskInput) taskInput.value = "";
        return;
    }

    state.tasks.push(newTask);
    saveTasks();
    renderTasks();
    e.target.reset();
});

retrieveTaskBtn?.addEventListener("click", () => renderTasks());

taskDisplay?.addEventListener("click", function (e) {
    const target = e.target;
    const taskItem = target.closest(".task-item");
    if (!taskItem) return;

    let changed = false;
    const taskID = taskItem.dataset.id;
    const task = state.tasks.find((t) => String(t.id) === String(taskID));
    if (!task) return;

    if (target.matches(".expand-btn")) {
        taskItem.classList.toggle("expanded");
    } else if (target.matches(".complete-checkbox")) {
        changed = true;
        task.completed = !task.completed;
    } else if (target.matches(".edit-btn")) {
        editTask(taskItem);
    } else if (target.matches(".delete-btn")) {
        if (confirm(`Are you sure you want to delete the task: "${task.name}"?`)) {
            changed = true;
            state.tasks = state.tasks.filter((t) => String(t.id) !== String(taskID));
        }
    }

    if (changed) {
        saveTasks();
        renderTasks();
    }
});

urgencyFilterBtn?.addEventListener("change", (e) => {
    state.filters.urgency = e.target.value;
    renderTasks();
});

difficultyFilterBtn?.addEventListener("change", (e) => {
    state.filters.difficulty = e.target.value;
    renderTasks();
});

streamlineMode?.addEventListener("change", (e) => {
    state.streamline = e.target.checked;
    renderTasks();
});

// Tabs
authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        authTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        if (tab.dataset.tab === "login") {
            registerFormEl?.classList.add("hidden");
            loginFormEl?.classList.remove("hidden");
        } else {
            loginFormEl?.classList.add("hidden");
            registerFormEl?.classList.remove("hidden");
        }
    });
});

// ========== Auth (JWT) ==========
async function showDashboard() {
    authContainer?.classList.add("hidden");
    appContainer?.classList.remove("hidden");

    // Try backend tasks first; fallback silently to local tasks
    try {
        const data = await api.getTasks();
        // Expecting { data: Task[] } from backend; adjust if your API returns differently
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        // normalize and replace local tasks view (not overwriting localStorage automatically)
        state.tasks = list.map((t) => ({
            id: t.id ?? cryptoId(),
            name: t.name ?? "Untitled",
            urgency: t.urgency ?? "later",
            difficulty: t.difficulty ?? "Easy",
            deadlineDate: t.deadlineDate ?? "",
            deadlineTime: t.deadlineTime ?? "",
            completed: Boolean(t.completed ?? t.completed),
            autoUrgency: Boolean(t.autoUrgency),
            scope: t.scope ?? "small",
            dateCreated: t.dateCreated ?? new Date().toISOString(),
        }));
    } catch (_) {
        // keep local tasks if backend fetch fails
    }

    renderTasks();
}

function showAuth() {
    appContainer?.classList.add("hidden");
    authContainer?.classList.remove("hidden");
}

loginFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErrorEl.textContent = "";
    const email = loginFormEl.elements.email.value.trim();
    const password = loginFormEl.elements.password.value;
    try {
        const data = await api.login(email, password);
        if (!data?.token) throw new Error("No token returned");
        setToken(data.token, true);
        await showDashboard();
    } catch (err) {
        loginErrorEl.textContent = err.message || "Login failed";
    }
});

registerFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    registerErrorEl.textContent = "";
    const name = registerFormEl.elements.name.value.trim();
    const email = registerFormEl.elements.email.value.trim();
    const password = registerFormEl.elements.password.value;
    const confirmPass = registerFormEl.elements.confirm.value;
    if (password !== confirmPass) {
        registerErrorEl.textContent = "Passwords do not match";
        return;
    }
    try {
        const data = await api.register(name, email, password);
        if (!data?.token) throw new Error("No token returned");
        setToken(data.token, true);
        await showDashboard();
    } catch (err) {
        registerErrorEl.textContent = err.message || "Registration failed";
    }
});

logoutBtn?.addEventListener("click", () => {
    clearToken();
    showAuth();
});

// ========== Init ==========
(function init() {
    loadTasks();
    renderTasks();

    // If there's a token, go straight to dashboard
    if (state.token) {
        showDashboard();
    } else {
        showAuth();
    }
})();